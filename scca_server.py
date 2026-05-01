import os
import io
import json
import base64
import time
import uuid
import hashlib
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

# SSL Certificate Fix for HuggingFace downloads on Windows
import ssl
import urllib3
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)
ssl._create_default_https_context = ssl._create_unverified_context

# Set HuggingFace offline mode with SSL bypass
os.environ['HF_HUB_DISABLE_TELEMETRY'] = '1'

app = Flask(__name__)
# Enable CORS so the Vite local frontend can talk to this Flask server
CORS(app)

# Global variables for the loaded architectural components
model = None
processor = None
index = None
concept_metadata = None
device = "cpu"
SERVER_READY = False
adaptive_learner = None  # Dynamic concept learner

ROOT_DIR = Path(__file__).resolve().parent
DATA_DIR = ROOT_DIR / "public" / "data"
LEXICON_PATH = DATA_DIR / "lexicon.json"
PROFILE_CATALOG_PATH = DATA_DIR / "concept_profiles.json"
AUDIT_LOG_PATH = ROOT_DIR / "learned_concepts_audit.jsonl"

# Deterministic gating for real-world use
MIN_COSINE_SIMILARITY = 0.24
MIN_TOP_GAP = 0.02

DEFAULT_PROFILE_CATALOG = {
    "version": "fallback",
    "core_visual_concepts": [],
    "curated_profiles": {},
    "fallback": {
        "min_cosine": 0.22,
        "min_gap": 0.0,
        "min_visual": 0.1,
        "temperature": 0.18,
        "source": "fallback"
    }
}


def _load_json_file(path, fallback):
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return fallback


def _write_json_file(path, payload):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(payload, f, indent=2)


def _append_audit_event(event_type, payload):
    try:
        event = {
            "event": event_type,
            "timestamp": time.time(),
            **payload
        }
        with open(AUDIT_LOG_PATH, "a", encoding="utf-8") as f:
            f.write(json.dumps(event) + "\n")
    except Exception as exc:
        print(f"⚠ Failed to append audit event: {exc}")


PROFILE_CATALOG = _load_json_file(PROFILE_CATALOG_PATH, DEFAULT_PROFILE_CATALOG)
LEXICON_CATALOG = _load_json_file(LEXICON_PATH, {})


def _clamp01(value):
    return max(0.0, min(1.0, float(value)))


def _analyze_visual_quality(img):
    """Return lightweight OpenCV/PIL image quality diagnostics."""
    try:
        import numpy as np

        rgb = np.array(img.convert("RGB"))
        gray = np.array(img.convert("L"))

        # Optional OpenCV path if available.
        cv2 = None
        try:
            import cv2  # type: ignore
        except Exception:
            cv2 = None

        if cv2 is not None:
            blur_variance = float(cv2.Laplacian(gray, cv2.CV_64F).var())
            edges = cv2.Canny(gray, 80, 160)
            edge_density = float(np.count_nonzero(edges)) / float(edges.size or 1)
            hsv = cv2.cvtColor(rgb, cv2.COLOR_RGB2HSV)
            saturation = float(np.mean(hsv[:, :, 1])) / 255.0
        else:
            # Pure NumPy fallback for environments without OpenCV.
            gx = np.abs(np.diff(gray.astype(np.float32), axis=1)).mean() if gray.shape[1] > 1 else 0.0
            gy = np.abs(np.diff(gray.astype(np.float32), axis=0)).mean() if gray.shape[0] > 1 else 0.0
            blur_variance = float(gx + gy)
            edge_density = float(np.mean(np.abs(gray.astype(np.float32) - gray.astype(np.float32).mean()) > gray.std()))
            saturation = float(np.mean(np.std(rgb.astype(np.float32), axis=2))) / 255.0

        hist, _ = np.histogram(gray, bins=32, range=(0, 256), density=True)
        hist = hist[hist > 0]
        entropy = float(-(hist * np.log(hist)).sum()) if hist.size else 0.0
        entropy_norm = _clamp01(entropy / 4.5)

        blur_norm = _clamp01(blur_variance / 1200.0)
        edge_norm = _clamp01(edge_density / 0.18)
        saturation_norm = _clamp01(saturation / 0.32)
        contrast_norm = _clamp01(float(gray.std()) / 80.0)

        quality_score = (
            0.30 * blur_norm +
            0.25 * edge_norm +
            0.20 * saturation_norm +
            0.15 * contrast_norm +
            0.10 * entropy_norm
        )

        return {
            "blur_variance": round(blur_variance, 4),
            "edge_density": round(edge_density, 4),
            "saturation": round(saturation, 4),
            "entropy": round(entropy, 4),
            "quality_score": round(_clamp01(quality_score), 4),
        }
    except Exception as exc:
        return {
            "blur_variance": None,
            "edge_density": None,
            "saturation": None,
            "entropy": None,
            "quality_score": 0.5,
            "error": str(exc),
        }


def _safe_json(path, fallback=None):
    if fallback is None:
        fallback = {}
    try:
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return fallback


def _file_sha256(path):
    try:
        h = hashlib.sha256()
        with open(path, "rb") as f:
            for chunk in iter(lambda: f.read(8192), b""):
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        return None


class AdaptiveConceptLearner:
    """
    Dynamically learn and adapt confidence thresholds for any concept.
    Uses external curated profiles, learned profiles, and feedback-driven calibration.
    """
    
    def __init__(self, persistence_path="learned_concepts.json", profile_catalog=None):
        self.persistence_path = os.path.join(os.path.dirname(__file__), persistence_path)
        self.profile_catalog = profile_catalog or PROFILE_CATALOG
        self.concept_thresholds = {}  # {concept: {min_cosine, min_gap, min_visual, ...}}
        self.user_feedback = {}        # {concept: {correct: [], incorrect: []}}
        self.drift_events = []
        self.load_persisted_concepts()

    def load_persisted_concepts(self):
        """Load previously learned concepts from disk."""
        try:
            if os.path.exists(self.persistence_path):
                with open(self.persistence_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    self.concept_thresholds = data.get("thresholds", {})
                    self.user_feedback = data.get("feedback", {})
                    self.drift_events = data.get("drift_events", [])
                    print(f"✓ Loaded {len(self.concept_thresholds)} learned concepts")
            else:
                print("No persisted concepts found. Starting fresh.")
        except Exception as e:
            print(f"⚠ Failed to load persisted concepts: {e}. Starting fresh.")

    def save_persisted_concepts(self):
        """Save learned concepts to disk for persistence."""
        try:
            data = {
                "thresholds": self.concept_thresholds,
                "feedback": self.user_feedback,
                "drift_events": self.drift_events,
                "catalog_version": self.profile_catalog.get("version", "unknown"),
                "timestamp": time.time()
            }
            with open(self.persistence_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            print(f"⚠ Failed to save concepts: {e}")

    def _catalog_profile(self, concept_key):
        concept_key = str(concept_key).lower().strip()
        fallback = dict(self.profile_catalog.get("fallback", {}))
        curated = self.profile_catalog.get("curated_profiles", {}).get(concept_key, {})
        profile = {**fallback, **curated}
        profile["profile_source"] = "curated" if curated else fallback.get("source", "fallback")
        profile["core_visual_concept"] = concept_key in set(self.profile_catalog.get("core_visual_concepts", []))
        profile["concept"] = concept_key
        return profile

    def _operating_point_adjustment(self, operating_point):
        presets = {
            "balanced": {"cosine": 0.0, "visual": 0.0, "gap": 0.0},
            "precision": {"cosine": 0.03, "visual": 0.03, "gap": 0.01},
            "recall": {"cosine": -0.02, "visual": -0.01, "gap": -0.01},
            "safe": {"cosine": 0.05, "visual": 0.05, "gap": 0.02},
        }
        return presets.get(str(operating_point or "balanced").lower(), presets["balanced"])

    def _select_cluster_prototype(self, embedding_vectors):
        import numpy as np

        vectors = np.array(embedding_vectors, dtype=np.float32)
        norms = np.linalg.norm(vectors, axis=1, keepdims=True)
        vectors = vectors / (norms + 1e-8)

        prototype = None
        if len(vectors) >= 4:
            try:
                from sklearn.cluster import KMeans

                unique_vectors = np.unique(np.round(vectors, 6), axis=0)
                if len(unique_vectors) >= 2:
                    n_clusters = min(3, len(unique_vectors))
                    kmeans = KMeans(n_clusters=n_clusters, random_state=42, n_init=10)
                    labels = kmeans.fit_predict(vectors)
                    dominant_label = int(np.bincount(labels).argmax())
                    cluster_vectors = vectors[labels == dominant_label]
                    if len(cluster_vectors) > 0:
                        prototype = np.mean(cluster_vectors, axis=0)
            except Exception:
                prototype = None

        if prototype is None:
            prototype = np.mean(vectors, axis=0)

        prototype = prototype / (np.linalg.norm(prototype) + 1e-8)
        return vectors, prototype

    def learn_concept_from_embeddings(self, concept_name, embedding_vectors):
        """
        Learn thresholds dynamically from actual embeddings of a concept.
        """
        try:
            import numpy as np

            concept_key = str(concept_name).lower().strip()
            if len(embedding_vectors) < 2:
                print(f"⚠ Too few samples for '{concept_key}' ({len(embedding_vectors)}). Using adaptive defaults.")
                return self._get_adaptive_defaults(concept_key)

            vectors, prototype = self._select_cluster_prototype(embedding_vectors)
            cosines = np.clip(vectors @ prototype, -1.0, 1.0)

            mean_cosine = float(np.mean(cosines))
            std_cosine = float(np.std(cosines))
            q10 = float(np.percentile(cosines, 10))
            q25 = float(np.percentile(cosines, 25))
            q75 = float(np.percentile(cosines, 75))

            min_cosine = max(0.15, min(q25 - max(0.01, std_cosine * 0.5), 0.45))
            min_visual = max(0.08, min(0.28, 0.08 + (std_cosine * 0.25)))
            temperature = max(0.07, min(0.25, std_cosine + 0.05))
            confidence = float(1.0 / (1.0 + std_cosine))

            profile = {
                "min_cosine": float(min_cosine),
                "min_gap": 0.0,
                "min_visual": float(min_visual),
                "temperature": float(temperature),
                "prototype": prototype.tolist(),
                "learned": True,
                "num_samples": int(len(vectors)),
                "mean_cosine": mean_cosine,
                "std_cosine": std_cosine,
                "q10_cosine": q10,
                "q25_cosine": q25,
                "q75_cosine": q75,
                "confidence": confidence,
                "calibration": {"balanced": float(min_cosine), "precision": float(min_cosine), "recall": float(min_cosine)},
                "source": "learned"
            }

            self.concept_thresholds[concept_key] = profile
            self.save_persisted_concepts()
            _append_audit_event("learn-concept", {
                "concept": concept_key,
                "profile": profile,
                "sample_count": int(len(vectors))
            })

            print(f"✓ Learned '{concept_key}': min_cosine={min_cosine:.3f}, confidence={confidence:.2f}")
            return profile

        except Exception as e:
            print(f"✗ Error learning concept '{concept_name}': {e}")
            return self._get_adaptive_defaults(concept_name.lower())

    def _get_adaptive_defaults(self, concept_name):
        """Use curated profiles or safe defaults for unknown concepts."""
        concept_key = str(concept_name).lower().strip()
        similar_profiles = self._find_similar_concepts(concept_key)

        if similar_profiles:
            avg_cosine = sum(p.get("min_cosine", 0.22) for p in similar_profiles) / len(similar_profiles)
            avg_visual = sum(p.get("min_visual", 0.1) for p in similar_profiles) / len(similar_profiles)
            return {
                "min_cosine": float(avg_cosine),
                "min_gap": 0.0,
                "min_visual": float(avg_visual),
                "temperature": 0.18,
                "learned": False,
                "inferred_from": len(similar_profiles),
                "confidence": 0.5,
                "source": "inferred"
            }

        fallback = dict(self.profile_catalog.get("fallback", {}))
        fallback.setdefault("min_cosine", 0.22)
        fallback.setdefault("min_gap", 0.0)
        fallback.setdefault("min_visual", 0.1)
        fallback.setdefault("temperature", 0.18)
        fallback["learned"] = False
        fallback["confidence"] = 0.3
        fallback["source"] = fallback.get("source", "fallback")
        return fallback

    def _find_similar_concepts(self, concept_name):
        if not self.concept_thresholds:
            return []

        results = []
        concept_name_lower = str(concept_name).lower()
        for known_concept, profile in self.concept_thresholds.items():
            if (
                known_concept in concept_name_lower or
                concept_name_lower in known_concept or
                len(set(known_concept.split()) & set(concept_name_lower.split())) > 0
            ):
                results.append(profile)

        return results[:3]

    def _recompute_threshold_from_feedback(self, concept_key):
        """Refine thresholds based on accumulated user feedback using ROC-style selection."""
        try:
            import numpy as np

            correct = self.user_feedback.get(concept_key, {}).get("correct", [])
            incorrect = self.user_feedback.get(concept_key, {}).get("incorrect", [])

            if len(correct) < 2 or len(incorrect) < 2:
                return

            labeled = [(entry["cosine"], 1, entry["visual"]) for entry in correct] + [(entry["cosine"], 0, entry["visual"]) for entry in incorrect]
            scores = np.array([item[0] for item in labeled], dtype=np.float32)
            labels = np.array([item[1] for item in labeled], dtype=np.int32)
            visuals = np.array([item[2] for item in labeled], dtype=np.float32)

            thresholds = sorted(set(float(x) for x in scores.tolist()))
            if not thresholds:
                return

            pos_count = int(labels.sum())
            neg_count = int(len(labels) - pos_count)
            best_balanced = None
            best_precision = None
            best_recall = None

            def _metrics(threshold):
                preds = scores >= threshold
                tp = int(np.sum((preds == 1) & (labels == 1)))
                fp = int(np.sum((preds == 1) & (labels == 0)))
                tn = int(np.sum((preds == 0) & (labels == 0)))
                fn = int(np.sum((preds == 0) & (labels == 1)))
                precision = tp / (tp + fp) if (tp + fp) else 1.0
                recall = tp / pos_count if pos_count else 0.0
                fpr = fp / neg_count if neg_count else 0.0
                tpr = recall
                youden = tpr - fpr
                f1 = (2 * precision * recall / (precision + recall)) if (precision + recall) else 0.0
                return {
                    "threshold": float(threshold),
                    "precision": float(precision),
                    "recall": float(recall),
                    "fpr": float(fpr),
                    "tpr": float(tpr),
                    "youden_j": float(youden),
                    "f1": float(f1),
                    "tp": tp, "fp": fp, "tn": tn, "fn": fn
                }

            for threshold in thresholds:
                metrics = _metrics(threshold)
                if best_balanced is None or metrics["youden_j"] > best_balanced["youden_j"]:
                    best_balanced = metrics
                if best_precision is None or metrics["precision"] > best_precision["precision"] or (
                    metrics["precision"] == best_precision["precision"] and metrics["recall"] > best_precision["recall"]
                ):
                    best_precision = metrics
                if best_recall is None or metrics["recall"] > best_recall["recall"] or (
                    metrics["recall"] == best_recall["recall"] and metrics["precision"] > best_recall["precision"]
                ):
                    best_recall = metrics

            correct_cosines = np.array([entry["cosine"] for entry in correct], dtype=np.float32)
            incorrect_cosines = np.array([entry["cosine"] for entry in incorrect], dtype=np.float32)
            correct_visuals = np.array([entry["visual"] for entry in correct], dtype=np.float32)
            incorrect_visuals = np.array([entry["visual"] for entry in incorrect], dtype=np.float32)

            visual_threshold = float((np.mean(correct_visuals) + np.mean(incorrect_visuals)) / 2.0)
            visual_threshold = max(0.08, min(0.35, visual_threshold))

            if concept_key in self.concept_thresholds:
                profile = self.concept_thresholds[concept_key]
                profile["min_cosine"] = float(best_balanced["threshold"])
                profile["min_visual"] = float(visual_threshold)
                profile["temperature"] = float(max(0.07, min(0.25, np.std(scores) + 0.05)))
                profile["calibration"] = {
                    "balanced": best_balanced,
                    "precision": best_precision,
                    "recall": best_recall,
                    "auc_proxy": float(np.mean([1.0 if p > n else 0.0 for p in correct_cosines for n in incorrect_cosines])) if len(correct_cosines) and len(incorrect_cosines) else None
                }
                profile["feedback_refined"] = True
                profile["refinement_samples"] = len(labels)
                profile["feedback_positive_count"] = len(correct)
                profile["feedback_negative_count"] = len(incorrect)
                self.concept_thresholds[concept_key] = profile
                self.save_persisted_concepts()
                _append_audit_event("profile-refine", {"concept": concept_key, "profile": profile})
                print(f"✓ Refined '{concept_key}' threshold to {best_balanced['threshold']:.3f}")

        except Exception as e:
            print(f"⚠ Error refining threshold: {e}")

    def incorporate_user_feedback(self, concept, was_correct, cosine_sim, visual_quality):
        """Record user feedback to refine thresholds over time."""
        try:
            concept_key = str(concept).lower().strip()

            if concept_key not in self.user_feedback:
                self.user_feedback[concept_key] = {"correct": [], "incorrect": []}

            feedback_entry = {
                "cosine": float(cosine_sim),
                "visual": float(visual_quality),
                "timestamp": time.time()
            }

            if was_correct:
                self.user_feedback[concept_key]["correct"].append(feedback_entry)
            else:
                self.user_feedback[concept_key]["incorrect"].append(feedback_entry)

            self._recompute_threshold_from_feedback(concept_key)
            self.save_persisted_concepts()

            profile = self.get_threshold(concept_key)
            drift_score = abs(float(cosine_sim) - float(profile.get("min_cosine", 0.22))) + abs(float(visual_quality) - float(profile.get("min_visual", 0.1)))
            if drift_score > 0.25:
                drift_event = {
                    "concept": concept_key,
                    "drift_score": float(drift_score),
                    "cosine": float(cosine_sim),
                    "visual_quality": float(visual_quality),
                    "timestamp": time.time()
                }
                self.drift_events.append(drift_event)
                _append_audit_event("drift-alert", drift_event)

            _append_audit_event("feedback", {
                "concept": concept_key,
                "was_correct": bool(was_correct),
                "cosine": float(cosine_sim),
                "visual_quality": float(visual_quality)
            })
            print(f"✓ Feedback recorded for '{concept_key}'")

        except Exception as e:
            print(f"⚠ Error incorporating feedback: {e}")

    def get_threshold(self, concept_key, operating_point="balanced", visual_quality=None):
        """Get threshold for a concept using curated + learned + operating-point adjustments."""
        concept_key = str(concept_key).lower().strip()

        profile = self._catalog_profile(concept_key)
        learned = self.concept_thresholds.get(concept_key, {})
        profile = {**profile, **learned}
        profile["profile_source"] = "learned" if learned else profile.get("profile_source", "fallback")
        profile["selected_operating_point"] = str(operating_point or "balanced").lower()

        adjustment = self._operating_point_adjustment(operating_point)
        base_min_cosine = float(profile.get("min_cosine", MIN_COSINE_SIMILARITY))
        base_min_gap = float(profile.get("min_gap", MIN_TOP_GAP))
        base_min_visual = float(profile.get("min_visual", 0.1))
        temperature = float(profile.get("temperature", self.profile_catalog.get("fallback", {}).get("temperature", 0.18)))

        if visual_quality is not None:
            visual_penalty = max(0.0, 0.65 - float(visual_quality)) * float(profile.get("visual_penalty", 0.08))
        else:
            visual_penalty = 0.0

        effective_min_cosine = max(0.05, min(0.95, base_min_cosine + adjustment["cosine"] + visual_penalty))
        effective_min_visual = max(0.0, min(1.0, base_min_visual + adjustment["visual"]))
        effective_min_gap = max(0.0, min(1.0, base_min_gap + adjustment["gap"]))

        calibration = profile.get("calibration", {}) or {}
        if profile.get("feedback_refined") and isinstance(calibration, dict):
            selected = calibration.get(profile["selected_operating_point"]) or calibration.get("balanced")
            if isinstance(selected, dict) and selected.get("threshold") is not None:
                effective_min_cosine = max(0.05, min(0.95, float(selected["threshold"]) + visual_penalty + adjustment["cosine"]))

        profile.update({
            "effective_min_cosine": float(effective_min_cosine),
            "effective_min_visual": float(effective_min_visual),
            "effective_min_gap": float(effective_min_gap),
            "temperature": float(max(0.05, min(0.35, temperature))),
            "visual_penalty": float(visual_penalty),
            "is_core_visual_concept": concept_key in set(self.profile_catalog.get("core_visual_concepts", []))
        })

        return profile


def initialize_ai():
    global model, processor, index, concept_metadata, device, SERVER_READY, adaptive_learner
    try:
        import torch
        import faiss
        import numpy as np
        from transformers import CLIPProcessor, CLIPModel
        
        # Initialize adaptive learner first
        adaptive_learner = AdaptiveConceptLearner(profile_catalog=PROFILE_CATALOG)
        print("✓ Adaptive concept learner initialized")
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Loading custom SCCA model on {device}...")
        
        # Look for the finetuned folder
        model_path = os.path.join(os.path.dirname(__file__), "scca_finetuned")
        index_path = os.path.join(os.path.dirname(__file__), "3d_model_retrieval.index")
        map_path = os.path.join(os.path.dirname(__file__), "concept_map.json")
        
        if not os.path.exists(model_path):
            print(f"WARNING: Extracted model folder not found at {model_path}. Please extract Zip file here.")
            return

        # Load the universal math pre-processor from HuggingFace with retry
        print("Loading CLIP processor from HuggingFace...")
        max_retries = 3
        for attempt in range(max_retries):
            try:
                processor = CLIPProcessor.from_pretrained(
                    "openai/clip-vit-base-patch16",
                    trust_remote_code=True
                )
                print("✓ CLIP processor loaded successfully")
                break
            except Exception as e:
                if attempt < max_retries - 1:
                    print(f"  Attempt {attempt + 1} failed: {str(e)[:100]}... Retrying...")
                else:
                    print(f"  WARNING: Could not load from HuggingFace. Using local cache if available.")
                    processor = CLIPProcessor.from_pretrained(
                        "openai/clip-vit-base-patch16",
                        trust_remote_code=True,
                        local_files_only=True
                    )
        
        # Load your actual fine-tuned custom tensors from your hard drive
        model = CLIPModel.from_pretrained(model_path).to(device)
        model.eval()
        print("✓ Fine-tuned SCCA model loaded")
        
        print("Loading FAISS GPU index...")
        index = faiss.read_index(index_path)
        print("✓ FAISS index loaded")
        
        print("Loading Concept Metadata...")
        with open(map_path, "r") as f:
            concept_metadata = json.load(f)
        print("✓ Concept metadata loaded")
            
        SERVER_READY = True
        print("\n" + "="*50)
        print("✓ HIGH-LEVEL RESEARCH SCCA SERVER READY")
        print("="*50)
        print("Listening for Image Payloads from EduVerse Javascript API...")
        print(f"Server Address: http://127.0.0.1:5000")
        print("="*50 + "\n")
    except ImportError as e:
        print(f"CRITICAL ERROR: Missing Python libraries. {e}")
        print("Please run: pip install torch faiss-cpu transformers flask flask-cors Pillow numpy")
    except Exception as e:
        print(f"Server initialization failed: {e}")

@app.route('/predict', methods=['POST'])
def predict():
    if not SERVER_READY:
        return jsonify({"error": "SCCA Architecture not loaded. Check terminal for missing PyTorch dependencies."}), 500
        
    try:
        request_id = request.headers.get("X-Request-Id") or str(uuid.uuid4())
        t0 = time.perf_counter()
        data = request.json
        if not data or 'image' not in data:
            return jsonify({"error": "No image data provided in payload", "request_id": request_id}), 400

        top_k = data.get('top_k', 3)
        try:
            top_k = int(top_k)
        except Exception:
            top_k = 3
        top_k = max(1, min(top_k, 10))
            
        # Parse base64 image coming from frontend canvas
        image_data = data['image']
        if ',' in image_data:
            image_data = image_data.split(',')[1]
            
        t_decode_start = time.perf_counter()
        image_bytes = base64.b64decode(image_data)
        decode_ms = (time.perf_counter() - t_decode_start) * 1000.0

        t_preprocess_start = time.perf_counter()
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        preprocess_ms = (time.perf_counter() - t_preprocess_start) * 1000.0

        visual_quality = _analyze_visual_quality(img)
        visual_quality_score = float(visual_quality.get("quality_score", 0.5))
        
        import torch
        import numpy as np
        # Forward Pass through Custom Vision Transformer
        t_embed_start = time.perf_counter()
        inputs = processor(images=img, return_tensors="pt").to(device)
        with torch.no_grad():
            img_embed = model.get_image_features(**inputs)
            # Extractor Fallback for Transformer Versions
            if hasattr(img_embed, "image_embeds"): img_embed = img_embed.image_embeds
            elif hasattr(img_embed, "pooler_output"): img_embed = img_embed.pooler_output
            elif not isinstance(img_embed, torch.Tensor): img_embed = img_embed[0]
            
            img_embed = img_embed / img_embed.norm(p=2, dim=-1, keepdim=True)
            img_np = img_embed.cpu().numpy()
        embed_ms = (time.perf_counter() - t_embed_start) * 1000.0
            
        # Mathematical Latent Space Retrieval (FAISS)
        t_search_start = time.perf_counter()
        distances, indices = index.search(img_np, top_k)
        search_ms = (time.perf_counter() - t_search_start) * 1000.0

        best_match_idx = indices[0][0]
        cosine_sim = float(distances[0][0])
        best_match_data = concept_metadata[best_match_idx]
        second_cosine = float(distances[0][1]) if top_k > 1 and len(distances[0]) > 1 else 0.0
        top_gap = cosine_sim - second_cosine
        concept_key = str(best_match_data.get("concept", "")).lower()
        
        # Use adaptive learner to get thresholds (learned or defaults)
        operating_point = str(data.get("operating_point", "balanced")).lower().strip()
        confidence_profile = adaptive_learner.get_threshold(concept_key, operating_point=operating_point, visual_quality=visual_quality_score)
        min_cosine = float(confidence_profile.get("effective_min_cosine", confidence_profile.get("min_cosine", MIN_COSINE_SIMILARITY)))
        min_gap = float(confidence_profile.get("effective_min_gap", confidence_profile.get("min_gap", MIN_TOP_GAP)))
        min_visual = float(confidence_profile.get("effective_min_visual", confidence_profile.get("min_visual", 0.12)))
        temperature = max(0.05, float(confidence_profile.get("temperature", 0.18)))

        deterministic_pass = cosine_sim >= min_cosine and visual_quality_score >= min_visual

        if not confidence_profile.get("is_core_visual_concept", False):
            deterministic_pass = deterministic_pass and top_gap >= min_gap

        cosine_margin = cosine_sim - min_cosine
        gap_margin = top_gap - min_gap
        visual_margin = visual_quality_score - min_visual
        base_probability = 1.0 / (1.0 + float(np.exp(-cosine_margin / temperature)))
        gap_probability = 1.0 / (1.0 + float(np.exp(-gap_margin / max(temperature, 0.08))))
        visual_probability = 1.0 / (1.0 + float(np.exp(-(visual_margin) / max(temperature, 0.08))))
        calibrated_probability = max(0.0, min(1.0, base_probability * gap_probability * visual_probability))
        uncertainty = max(0.0, min(1.0, 1.0 - calibrated_probability))
        confidence_interval = {
            "lower": max(0.0, calibrated_probability - (temperature * 0.8)),
            "upper": min(1.0, calibrated_probability + (temperature * 0.8))
        }

        top_matches = []
        for rank, idx in enumerate(indices[0]):
            if idx < 0 or idx >= len(concept_metadata):
                continue
            matched = concept_metadata[idx]
            top_matches.append({
                "rank": rank + 1,
                "concept_index": int(idx),
                "concept": matched.get("concept", "unknown"),
                "domain": matched.get("domain", "unknown"),
                "full_cognitive_string": matched.get("desc", ""),
                "cosine_similarity": float(distances[0][rank])
            })
        
        # Generate the Neural Blueprint Array from the Vision Embedding
        # Extract 16 tensor dimensions, normalize them to [0,1], and use them as 
        # physical layout constraints for the Generative CAD assembly.
        blueprint_seed = np.abs(img_np[0][:16])
        blueprint_seed = (blueprint_seed / (np.max(blueprint_seed) + 1e-9)).tolist()

        total_ms = (time.perf_counter() - t0) * 1000.0

        print(
            f"[PREDICT] request_id={request_id} matched={best_match_data['concept']} "
            f"cosine={cosine_sim:.3f} gap={top_gap:.3f} vq={visual_quality_score:.3f} pass={deterministic_pass} "
            f"op={operating_point} prob={calibrated_probability:.3f} u={uncertainty:.3f} k={top_k} total_ms={total_ms:.2f}"
        )
        
        return jsonify({
            "success": True,
            "request_id": request_id,
            "concept": best_match_data["concept"],
            "domain": best_match_data["domain"],
            "full_cognitive_string": best_match_data["desc"],
            "cosine_similarity": cosine_sim,
            "second_cosine_similarity": second_cosine,
            "top_gap": top_gap,
            "deterministic_pass": deterministic_pass,
            "requires_concept_confirmation": not deterministic_pass,
            "operating_point": operating_point,
            "profile_source": confidence_profile.get("profile_source", "fallback"),
            "confidence_profile": confidence_profile,
            "calibrated_probability": calibrated_probability,
            "uncertainty": uncertainty,
            "confidence_interval": confidence_interval,
            "visual_quality": visual_quality,
            "generative_blueprint": blueprint_seed,
            "top_k": top_k,
            "top_matches": top_matches,
            "timing_ms": {
                "decode_ms": round(decode_ms, 3),
                "preprocess_ms": round(preprocess_ms, 3),
                "embed_ms": round(embed_ms, 3),
                "search_ms": round(search_ms, 3),
                "total_ms": round(total_ms, 3)
            }
        })
    except Exception as e:
        print(f"Prediction Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/learn-concept', methods=['POST'])
def learn_concept():
    """
    Allow users to teach the system a new concept.
    POST: {concept: "quadcopter", images: [base64_1, base64_2, ...]}
    
    Returns learned thresholds or error.
    """
    if not SERVER_READY:
        return jsonify({"error": "Server not ready"}), 503
    
    try:
        data = request.json
        if not data or 'concept' not in data or 'images' not in data:
            return jsonify({"error": "Missing 'concept' or 'images' field"}), 400
        
        concept_name = str(data['concept']).strip()
        images = data.get('images', [])
        
        if not concept_name or len(concept_name) < 2:
            return jsonify({"error": "Concept name too short"}), 400
        
        if len(images) < 2:
            return jsonify({"error": "Need at least 2 sample images"}), 400
        
        if len(images) > 10:
            return jsonify({"error": "Maximum 10 images per learning session"}), 400
        
        # Extract embeddings from all images
        import torch
        import numpy as np
        
        embeddings = []
        
        for idx, img_b64 in enumerate(images):
            try:
                if not img_b64 or not isinstance(img_b64, str):
                    return jsonify({"error": f"Image {idx} is missing or invalid"}), 400

                # Decode image
                if ',' in img_b64:
                    img_b64 = img_b64.split(',')[1]
                
                image_bytes = base64.b64decode(img_b64)
                img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
                
                # Get embedding
                inputs = processor(images=img, return_tensors="pt").to(device)
                with torch.no_grad():
                    embed = model.get_image_features(**inputs)
                    if hasattr(embed, "image_embeds"):
                        embed = embed.image_embeds
                    elif hasattr(embed, "pooler_output"):
                        embed = embed.pooler_output
                    elif not isinstance(embed, torch.Tensor):
                        embed = embed[0]
                    
                    embed = embed / embed.norm(p=2, dim=-1, keepdim=True)
                    embeddings.append(embed.cpu().numpy()[0])
            
            except Exception as e:
                print(f"⚠ Failed to process image {idx}: {e}")
                return jsonify({
                    "error": f"Failed to process image {idx}: {str(e)}"
                }), 400
        
        if len(embeddings) < 2:
            return jsonify({"error": "Could not extract embeddings from images"}), 400
        
        # Learn thresholds from embeddings
        profile = adaptive_learner.learn_concept_from_embeddings(
            concept_name,
            np.array(embeddings, dtype=np.float32)
        )
        
        return jsonify({
            "success": True,
            "concept": concept_name,
            "profile": profile,
            "num_samples": len(embeddings),
            "message": f"✓ Learned concept '{concept_name}' from {len(embeddings)} images"
        })
    
    except Exception as e:
        print(f"Learn Concept Error: {e}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500


@app.route('/feedback', methods=['POST'])
def feedback():
    """
    User provides feedback on a classification.
    POST: {concept: "airplane", was_correct: true, cosine: 0.27, visual_quality: 0.45}
    
    System uses this to refine thresholds over time.
    """
    if not SERVER_READY:
        return jsonify({"error": "Server not ready"}), 503
    
    try:
        data = request.json
        if not data or 'concept' not in data or 'was_correct' not in data:
            return jsonify({"error": "Missing required fields"}), 400
        
        concept = str(data['concept']).strip()
        was_correct = bool(data['was_correct'])
        cosine = float(data.get('cosine', 0.5))
        visual_quality = float(data.get('visual_quality', 0.5))
        
        # Validate ranges
        if not (0 <= cosine <= 1):
            return jsonify({"error": "cosine must be between 0 and 1"}), 400
        if not (0 <= visual_quality <= 1):
            return jsonify({"error": "visual_quality must be between 0 and 1"}), 400
        
        # Record feedback
        adaptive_learner.incorporate_user_feedback(concept, was_correct, cosine, visual_quality)
        
        return jsonify({
            "success": True,
            "concept": concept,
            "was_correct": was_correct,
            "message": "✓ Feedback recorded and will help improve future predictions"
        })
    
    except ValueError as e:
        return jsonify({"error": f"Invalid input: {str(e)}"}), 400
    except Exception as e:
        print(f"Feedback Error: {e}")
        return jsonify({"error": f"Server error: {str(e)}"}), 500


@app.route('/lexicon', methods=['GET'])
def lexicon():
    """Return the shared semantic lexicon used by the AR frontend."""
    return jsonify({
        "success": True,
        "version": PROFILE_CATALOG.get("version", "unknown"),
        "count": len(LEXICON_CATALOG),
        "entries": LEXICON_CATALOG
    })


@app.route('/profiles', methods=['GET'])
def profiles():
    """Return curated, learned, and drift metadata for research inspection."""
    concept_filter = str(request.args.get("concept", "")).lower().strip()
    learned_profiles = adaptive_learner.concept_thresholds if adaptive_learner else {}
    feedback_counts = {}

    if adaptive_learner:
        for concept_key, payload in adaptive_learner.user_feedback.items():
            feedback_counts[concept_key] = {
                "correct": len(payload.get("correct", [])),
                "incorrect": len(payload.get("incorrect", []))
            }

    curated_profiles = PROFILE_CATALOG.get("curated_profiles", {})

    def _filter_map(mapping):
        if not concept_filter:
            return mapping
        return {key: value for key, value in mapping.items() if concept_filter in key.lower()}

    return jsonify({
        "success": True,
        "version": PROFILE_CATALOG.get("version", "unknown"),
        "core_visual_concepts": PROFILE_CATALOG.get("core_visual_concepts", []),
        "fallback": PROFILE_CATALOG.get("fallback", {}),
        "curated_profiles": _filter_map(curated_profiles),
        "learned_profiles": _filter_map(learned_profiles),
        "feedback_counts": _filter_map(feedback_counts),
        "drift_events": adaptive_learner.drift_events[-50:] if adaptive_learner else [],
        "catalog_path": str(PROFILE_CATALOG_PATH),
        "audit_path": str(AUDIT_LOG_PATH)
    })


@app.route('/profiles/update', methods=['POST'])
def update_profiles():
    """Update curated profile data for controlled experiments and auditability."""
    if not SERVER_READY:
        return jsonify({"error": "Server not ready"}), 503

    try:
        data = request.json or {}
        concept = str(data.get("concept", "")).lower().strip()
        profile_update = data.get("profile", {})

        if not concept:
            return jsonify({"error": "Missing 'concept'"}), 400
        if not isinstance(profile_update, dict):
            return jsonify({"error": "'profile' must be an object"}), 400

        curated_profiles = PROFILE_CATALOG.setdefault("curated_profiles", {})
        merged = dict(curated_profiles.get(concept, PROFILE_CATALOG.get("fallback", {})))
        merged.update(profile_update)
        merged["source"] = "curated"
        merged["updated_at"] = time.time()
        curated_profiles[concept] = merged

        if isinstance(data.get("core_visual_concepts"), list):
            PROFILE_CATALOG["core_visual_concepts"] = [str(item).lower().strip() for item in data["core_visual_concepts"] if str(item).strip()]

        PROFILE_CATALOG["version"] = str(data.get("version", PROFILE_CATALOG.get("version", "2.0.0")))
        _write_json_file(PROFILE_CATALOG_PATH, PROFILE_CATALOG)

        if adaptive_learner:
            adaptive_learner.profile_catalog = PROFILE_CATALOG

        _append_audit_event("profile-update", {
            "concept": concept,
            "profile": merged,
            "version": PROFILE_CATALOG.get("version")
        })

        return jsonify({
            "success": True,
            "concept": concept,
            "profile": merged,
            "version": PROFILE_CATALOG.get("version")
        })

    except Exception as e:
        print(f"Profile Update Error: {e}")
        return jsonify({"error": str(e)}), 500


@app.route('/audit', methods=['GET'])
def audit():
    """Return recent audit events for drift and update inspection."""
    limit = request.args.get("limit", 50)
    try:
        limit = max(1, min(200, int(limit)))
    except Exception:
        limit = 50

    events = []
    try:
        if AUDIT_LOG_PATH.exists():
            with open(AUDIT_LOG_PATH, "r", encoding="utf-8") as f:
                lines = f.readlines()[-limit:]
                for line in lines:
                    line = line.strip()
                    if line:
                        try:
                            events.append(json.loads(line))
                        except Exception:
                            continue
    except Exception as e:
        return jsonify({"error": str(e)}), 500

    return jsonify({
        "success": True,
        "count": len(events),
        "events": events,
        "audit_path": str(AUDIT_LOG_PATH)
    })


@app.route('/health', methods=['GET'])
def health():
    model_path = os.path.join(os.path.dirname(__file__), "scca_finetuned")
    index_path = os.path.join(os.path.dirname(__file__), "3d_model_retrieval.index")
    map_path = os.path.join(os.path.dirname(__file__), "concept_map.json")

    checks = {
        "server_ready": SERVER_READY,
        "model_loaded": model is not None,
        "processor_loaded": processor is not None,
        "index_loaded": index is not None,
        "metadata_loaded": concept_metadata is not None,
        "model_path_exists": os.path.exists(model_path),
        "index_path_exists": os.path.exists(index_path),
        "concept_map_exists": os.path.exists(map_path)
    }
    status = "ok" if all(checks.values()) else "degraded"
    return jsonify({"status": status, "device": device, "checks": checks}), (200 if status == "ok" else 503)


@app.route('/meta', methods=['GET'])
def meta():
    root = os.path.dirname(__file__)
    model_dir = os.path.join(root, "scca_finetuned")
    model_files = {
        "config": os.path.join(model_dir, "config.json"),
        "weights": os.path.join(model_dir, "model.safetensors"),
        "processor_config": os.path.join(model_dir, "processor_config.json"),
        "tokenizer": os.path.join(model_dir, "tokenizer.json"),
        "tokenizer_config": os.path.join(model_dir, "tokenizer_config.json")
    }

    cfg = _safe_json(model_files["config"], {})
    processor_cfg = _safe_json(model_files["processor_config"], {})
    tokenizer_cfg = _safe_json(model_files["tokenizer_config"], {})

    artifacts = {}
    for name, path in model_files.items():
        exists = os.path.exists(path)
        artifacts[name] = {
            "exists": exists,
            "size_bytes": os.path.getsize(path) if exists else None,
            "sha256": _file_sha256(path) if exists else None
        }

    return jsonify({
        "server_ready": SERVER_READY,
        "device": device,
        "clip_backbone": cfg.get("_name_or_path", "openai/clip-vit-base-patch16"),
        "projection_dim": cfg.get("projection_dim"),
        "vision_hidden_size": cfg.get("vision_config", {}).get("hidden_size"),
        "text_hidden_size": cfg.get("text_config", {}).get("hidden_size"),
        "image_size": processor_cfg.get("size", {}).get("shortest_edge"),
        "tokenizer_model_max_length": tokenizer_cfg.get("model_max_length"),
        "concept_count": len(concept_metadata) if concept_metadata else 0,
        "index_total_vectors": int(index.ntotal) if index is not None else 0,
        "artifacts": artifacts,
        "claim_guard": {
            "pretrained_backbone_used": True,
            "foundation_model_trained_here": False,
            "downstream_novelty_scope": [
                "retrieval orchestration",
                "educational adaptation",
                "AR learning integration"
            ]
        }
    })

if __name__ == '__main__':
    initialize_ai()
    # Runs the local REST API server
    app.run(host='127.0.0.1', port=5000, debug=False)
