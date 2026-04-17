import os
import io
import json
import base64
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

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

def initialize_ai():
    global model, processor, index, concept_metadata, device, SERVER_READY
    try:
        import torch
        import faiss
        import numpy as np
        from transformers import CLIPProcessor, CLIPModel
        
        device = "cuda" if torch.cuda.is_available() else "cpu"
        print(f"Loading custom SCCA model on {device}...")
        
        # Look for the finetuned folder
        model_path = os.path.join(os.path.dirname(__file__), "scca_finetuned")
        index_path = os.path.join(os.path.dirname(__file__), "3d_model_retrieval.index")
        map_path = os.path.join(os.path.dirname(__file__), "concept_map.json")
        
        if not os.path.exists(model_path):
            print(f"WARNING: Extracted model folder not found at {model_path}. Please extract Zip file here.")
            return

        # Load the universal math pre-processor from HuggingFace
        processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch16")
        
        # Load your actual fine-tuned custom tensors from your hard drive
        model = CLIPModel.from_pretrained(model_path).to(device)
        model.eval()
        
        print("Loading FAISS GPU index...")
        index = faiss.read_index(index_path)
        
        print("Loading Concept Metadata...")
        with open(map_path, "r") as f:
            concept_metadata = json.load(f)
            
        SERVER_READY = True
        print("\n=== HIGH-LEVEL RESEARCH SCCA SERVER READY ===")
        print("Listening for Image Payloads from EduVerse Javascript API...")
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
        data = request.json
        if not data or 'image' not in data:
            return jsonify({"error": "No image data provided in payload"}), 400
            
        # Parse base64 image coming from frontend canvas
        image_data = data['image']
        if ',' in image_data:
            image_data = image_data.split(',')[1]
            
        image_bytes = base64.b64decode(image_data)
        img = Image.open(io.BytesIO(image_bytes)).convert('RGB')
        
        import torch
        # Forward Pass through Custom Vision Transformer
        inputs = processor(images=img, return_tensors="pt").to(device)
        with torch.no_grad():
            img_embed = model.get_image_features(**inputs)
            # Extractor Fallback for Transformer Versions
            if hasattr(img_embed, "image_embeds"): img_embed = img_embed.image_embeds
            elif hasattr(img_embed, "pooler_output"): img_embed = img_embed.pooler_output
            elif not isinstance(img_embed, torch.Tensor): img_embed = img_embed[0]
            
            img_embed = img_embed / img_embed.norm(p=2, dim=-1, keepdim=True)
            img_np = img_embed.cpu().numpy()
            
        # Mathematical Latent Space Retrieval (FAISS)
        distances, indices = index.search(img_np, 1)
        best_match_idx = indices[0][0]
        cosine_sim = float(distances[0][0])
        best_match_data = concept_metadata[best_match_idx]
        
        print(f"[PREDICT] Matched: {best_match_data['concept']} | Cosine Similarity: {cosine_sim:.3f}")
        
        return jsonify({
            "success": True,
            "concept": best_match_data["concept"],
            "domain": best_match_data["domain"],
            "full_cognitive_string": best_match_data["desc"],
            "cosine_similarity": cosine_sim
        })
    except Exception as e:
        print(f"Prediction Error: {e}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    initialize_ai()
    # Runs the local REST API server
    app.run(host='127.0.0.1', port=5000, debug=False)
