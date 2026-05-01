import os
import re
import time
import secrets
import hashlib
import urllib.request
import urllib.parse
from datetime import timedelta

from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_jwt_extended import (
    JWTManager,
    create_access_token,
    get_jwt_identity,
    jwt_required,
)
from flask_socketio import SocketIO, join_room, emit
from werkzeug.security import generate_password_hash, check_password_hash


ROOT_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.environ.get("EDUVERSE_PLATFORM_DB", os.path.join(ROOT_DIR, "eduverse_platform.db"))
JWT_SECRET = os.environ.get("EDUVERSE_JWT_SECRET", "dev-secret-change-me")
MODEL_CACHE_DIR = os.environ.get("EDUVERSE_MODEL_CACHE_DIR", os.path.join(ROOT_DIR, "public", "models", "generated"))


def _http_get_json(url: str, timeout_s: int = 12):
    req = urllib.request.Request(url, headers={"User-Agent": "EduVerse/1.0"}, method="GET")
    with urllib.request.urlopen(req, timeout=timeout_s) as resp:
        raw = resp.read()
    import json

    return json.loads(raw.decode("utf-8", errors="replace"))


def _commons_file_download_url(file_title: str) -> str | None:
    """
    file_title is the Commons file name WITHOUT 'File:' prefix (e.g., 'EiffelTower fixed.stl').
    """
    title = "File:" + file_title
    api = (
        "https://commons.wikimedia.org/w/api.php?"
        + urllib.parse.urlencode(
            {
                "action": "query",
                "titles": title,
                "prop": "imageinfo",
                "iiprop": "url",
                "format": "json",
                "formatversion": "2",
            }
        )
    )
    data = _http_get_json(api, timeout_s=12)
    pages = (data.get("query") or {}).get("pages") or []
    if not pages:
        return None
    info = (pages[0].get("imageinfo") or [])
    if not info:
        return None
    return info[0].get("url")


def _wikidata_search_entities(query: str, limit: int = 5):
    api = (
        "https://www.wikidata.org/w/api.php?"
        + urllib.parse.urlencode(
            {
                "action": "wbsearchentities",
                "search": query,
                "language": "en",
                "format": "json",
                "limit": str(limit),
            }
        )
    )
    data = _http_get_json(api, timeout_s=12)
    return data.get("search") or []


def _wikidata_entity_claims(entity_id: str):
    url = f"https://www.wikidata.org/wiki/Special:EntityData/{urllib.parse.quote(entity_id)}.json"
    data = _http_get_json(url, timeout_s=12)
    entities = data.get("entities") or {}
    return entities.get(entity_id) or {}


def _extract_p4896_commons_files(entity_payload: dict) -> list[str]:
    claims = entity_payload.get("claims") or {}
    p4896 = claims.get("P4896") or []
    files: list[str] = []
    for stmt in p4896:
        mainsnak = stmt.get("mainsnak") or {}
        dv = (mainsnak.get("datavalue") or {}).get("value")
        if isinstance(dv, str) and dv.lower().endswith(".stl"):
            files.append(dv)
    # Keep stable, deterministic order
    files = sorted(set(files), key=lambda s: s.lower())
    return files


db = SQLAlchemy()
jwt = JWTManager()
socketio = SocketIO(cors_allowed_origins="*", async_mode="threading")


def _now_ms():
    return int(time.time() * 1000)


def _clean_email(email: str) -> str:
    return (email or "").strip().lower()


def _valid_email(email: str) -> bool:
    if not email:
        return False
    return re.match(r"^[^@\s]+@[^@\s]+\.[^@\s]+$", email) is not None


def _make_code(length: int = 6) -> str:
    alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
    return "".join(secrets.choice(alphabet) for _ in range(length))


def _hash_password(password: str) -> str:
    return generate_password_hash(password)


def _verify_password(password: str, stored_hash: str) -> bool:
    # Backward compatibility for any previously saved bcrypt/passlib hashes.
    if stored_hash and stored_hash.startswith("$2"):
        try:
            from passlib.hash import bcrypt  # lazy import to avoid hard runtime dependency
            return bcrypt.verify(password, stored_hash)
        except Exception:
            return False
    return check_password_hash(stored_hash, password)


class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    display_name = db.Column(db.String(80), nullable=False, default="Student")
    preferred_language = db.Column(db.String(20), nullable=False, default="en")
    created_at_ms = db.Column(db.Integer, nullable=False, default=_now_ms)

    def to_public(self):
        return {
            "id": self.id,
            "email": self.email,
            "display_name": self.display_name,
            "preferred_language": self.preferred_language,
            "created_at_ms": self.created_at_ms,
        }


class PeerSession(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    code = db.Column(db.String(12), unique=True, nullable=False, index=True)
    created_by_user_id = db.Column(db.Integer, db.ForeignKey("user.id"), nullable=False)
    created_at_ms = db.Column(db.Integer, nullable=False, default=_now_ms)
    last_activity_ms = db.Column(db.Integer, nullable=False, default=_now_ms)
    active = db.Column(db.Boolean, nullable=False, default=True)


def create_app():
    app = Flask(__name__)
    app.config["SQLALCHEMY_DATABASE_URI"] = f"sqlite:///{DB_PATH}"
    app.config["SQLALCHEMY_TRACK_MODIFICATIONS"] = False
    app.config["JWT_SECRET_KEY"] = JWT_SECRET
    app.config["JWT_ACCESS_TOKEN_EXPIRES"] = timedelta(days=7)

    CORS(app, supports_credentials=True)
    db.init_app(app)
    jwt.init_app(app)
    socketio.init_app(app, cors_allowed_origins="*")

    with app.app_context():
        db.create_all()

    @app.get("/api/health")
    def health():
        return jsonify({"ok": True, "ts": _now_ms()})

    @app.get("/")
    def index():
        return (
            "EduVerse Platform Server is running. "
            "This server provides APIs at /api/* for auth, peer rooms, and coach analysis. "
            "Open the UI in your Vite frontend: http://localhost:5173/#/auth",
            200,
        )

    # ---------------------------
    # Models: STL -> GLB conversion + caching
    # ---------------------------
    @app.post("/api/models/convert-stl")
    def convert_stl():
        """
        Convert an STL into a GLB that the frontend can load with Three.js.
        Inputs:
          - stl_url: direct URL to an STL (preferred for Thingiverse/Printables CDN links)
          - OR stl_base64: base64 of STL bytes (optional)
        Returns:
          - glb_url: local cached URL under /models/generated/<hash>.glb
        """
        payload = request.get_json(force=True, silent=True) or {}
        stl_url = (payload.get("stl_url") or payload.get("image_data") or "").strip()
        stl_b64 = (payload.get("stl_base64") or "").strip()

        if not stl_url and not stl_b64:
            return jsonify({"error": "Provide stl_url or stl_base64"}), 400

        os.makedirs(MODEL_CACHE_DIR, exist_ok=True)

        raw_bytes = b""
        source_id = ""
        try:
            if stl_url:
                # Basic allowlist: must look like an STL file URL
                if not re.search(r"\.stl(\?|#|$)", stl_url.lower()):
                    return jsonify({"error": "stl_url must point to a .stl file"}), 400
                req = urllib.request.Request(
                    stl_url,
                    headers={"User-Agent": "EduVerse STL Converter/1.0"},
                    method="GET",
                )
                with urllib.request.urlopen(req, timeout=15) as resp:
                    raw_bytes = resp.read()
                source_id = stl_url
            else:
                import base64

                raw_bytes = base64.b64decode(stl_b64.encode("utf-8"), validate=False)
                source_id = f"base64:{len(raw_bytes)}"
        except Exception as e:
            return jsonify({"error": f"Failed to fetch/decode STL: {str(e)}"}), 400

        if not raw_bytes or len(raw_bytes) < 512:
            return jsonify({"error": "STL payload too small/invalid"}), 400

        digest = hashlib.sha256(raw_bytes).hexdigest()[:20]
        out_name = f"stl_{digest}.glb"
        out_path = os.path.join(MODEL_CACHE_DIR, out_name)
        out_url = f"/models/generated/{out_name}"

        if os.path.exists(out_path) and os.path.getsize(out_path) > 1024:
            return jsonify(
                {
                    "glb_url": out_url,
                    "cached": True,
                    "source_id": source_id,
                }
            )

        try:
            import tempfile
            import trimesh

            with tempfile.TemporaryDirectory() as td:
                stl_path = os.path.join(td, f"src_{digest}.stl")
                with open(stl_path, "wb") as f:
                    f.write(raw_bytes)

                mesh = trimesh.load(stl_path, force="mesh")
                if mesh is None:
                    raise ValueError("Could not load STL mesh")

                # Normalize scale/centering for consistent AR framing.
                mesh.apply_translation(-mesh.centroid)
                ext = mesh.extents
                max_dim = float(max(ext)) if ext is not None else 0.0
                if max_dim and max_dim > 0:
                    mesh.apply_scale(1.0 / max_dim)

                glb_bytes = trimesh.exchange.gltf.export_glb(mesh)
                with open(out_path, "wb") as f:
                    f.write(glb_bytes)
        except Exception as e:
            return jsonify({"error": f"STL->GLB conversion failed: {str(e)}"}), 500

        return jsonify(
            {
                "glb_url": out_url,
                "cached": False,
                "source_id": source_id,
            }
        )

    @app.post("/api/models/auto")
    def auto_model():
        """
        Automatic model acquisition using API-friendly open sources (no API keys):
          Wikidata entity search -> P4896 "3D model" -> Wikimedia Commons STL -> convert STL->GLB -> cache.

        Input:
          - concept: query string
        Output:
          - glb_url (local cached)
          - source, license, evidence
        """
        payload = request.get_json(force=True, silent=True) or {}
        concept = str(payload.get("concept") or "").strip()
        if not concept:
            return jsonify({"error": "Missing concept"}), 400

        # Search top entities and pick the first that provides an STL via P4896
        candidates = _wikidata_search_entities(concept, limit=6)
        for cand in candidates:
            entity_id = cand.get("id")
            if not entity_id:
                continue
            entity = _wikidata_entity_claims(entity_id)
            files = _extract_p4896_commons_files(entity)
            if not files:
                continue

            # Pick first STL deterministically
            commons_file = files[0]
            stl_url = _commons_file_download_url(commons_file)
            if not stl_url:
                continue

            # Convert STL -> GLB (same cache dir)
            convert_payload = {"stl_url": stl_url}
            # Call converter logic directly by reusing code path
            # (we inline by invoking convert_stl() mechanics with the URL)
            try:
                # mimic request by calling conversion helper through HTTP to self endpoint
                # (simple, keeps one code path)
                # If running behind different host/port, this still works locally.
                local_endpoint = f"http://127.0.0.1:{int(os.environ.get('EDUVERSE_PLATFORM_PORT','5001'))}/api/models/convert-stl"
                req = urllib.request.Request(
                    local_endpoint,
                    headers={"Content-Type": "application/json", "User-Agent": "EduVerse/1.0"},
                    data=(__import__("json").dumps(convert_payload).encode("utf-8")),
                    method="POST",
                )
                with urllib.request.urlopen(req, timeout=30) as resp:
                    raw = resp.read()
                out = __import__("json").loads(raw.decode("utf-8", errors="replace"))
                glb_url = out.get("glb_url")
                if not glb_url:
                    continue
            except Exception as e:
                return jsonify({"error": f"Auto conversion failed: {str(e)}"}), 500

            return jsonify(
                {
                    "glb_url": glb_url,
                    "model_name": commons_file.replace(".stl", ""),
                    "description": f"Open 3D model (Wikidata P4896) for {concept}",
                    "domain": "OPEN_SOURCE",
                    "category": "WIKIDATA_COMMONS_STL",
                    "keywords": [concept, commons_file],
                    "source": "Wikidata + Wikimedia Commons",
                    "license": "Wikimedia Commons file license (varies by file)",
                    "evidence": {
                        "entity_id": entity_id,
                        "entity_label": cand.get("label"),
                        "commons_file": commons_file,
                        "stl_url": stl_url,
                    },
                }
            )

        return jsonify(
            {
                "error": "No open 3D model found via Wikidata/Commons for this concept",
                "hint": "Try a more specific concept (e.g., 'Eiffel Tower', 'clavicle', 'barnstar')",
            }
        ), 404

    # ---------------------------
    # Auth
    # ---------------------------
    @app.post("/api/auth/signup")
    def signup():
        payload = request.get_json(force=True, silent=True) or {}
        email = _clean_email(payload.get("email"))
        password = payload.get("password") or ""
        display_name = (payload.get("display_name") or "Student").strip()[:80]
        preferred_language = (payload.get("preferred_language") or "en").strip()[:20]

        if not _valid_email(email):
            return jsonify({"error": "Invalid email"}), 400
        if len(password) < 8:
            return jsonify({"error": "Password must be at least 8 characters"}), 400

        existing = User.query.filter_by(email=email).first()
        if existing:
            return jsonify({"error": "Email already registered"}), 409

        user = User(
            email=email,
            password_hash=_hash_password(password),
            display_name=display_name or "Student",
            preferred_language=preferred_language or "en",
        )
        db.session.add(user)
        db.session.commit()

        token = create_access_token(identity=str(user.id))
        return jsonify({"token": token, "user": user.to_public()})

    @app.post("/api/auth/login")
    def login():
        payload = request.get_json(force=True, silent=True) or {}
        email = _clean_email(payload.get("email"))
        password = payload.get("password") or ""

        user = User.query.filter_by(email=email).first()
        if not user or not _verify_password(password, user.password_hash):
            return jsonify({"error": "Invalid email or password"}), 401

        token = create_access_token(identity=str(user.id))
        return jsonify({"token": token, "user": user.to_public()})

    @app.get("/api/auth/me")
    @jwt_required()
    def me():
        user_id = int(get_jwt_identity())
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        return jsonify({"user": user.to_public()})

    # ---------------------------
    # Peer sessions (join-by-code)
    # ---------------------------
    @app.post("/api/sessions/create")
    @jwt_required()
    def create_session():
        user_id = int(get_jwt_identity())
        code = _make_code(6)
        # ensure unique
        for _ in range(8):
            if not PeerSession.query.filter_by(code=code).first():
                break
            code = _make_code(6)

        session = PeerSession(code=code, created_by_user_id=user_id)
        db.session.add(session)
        db.session.commit()
        return jsonify({"code": session.code, "created_at_ms": session.created_at_ms})

    @app.post("/api/sessions/join")
    @jwt_required()
    def join_session():
        payload = request.get_json(force=True, silent=True) or {}
        code = (payload.get("code") or "").strip().upper()
        session = PeerSession.query.filter_by(code=code, active=True).first()
        if not session:
            return jsonify({"error": "Invalid or expired code"}), 404
        session.last_activity_ms = _now_ms()
        db.session.commit()
        return jsonify({"code": session.code, "created_at_ms": session.created_at_ms})

    # ---------------------------
    # Communication coach
    # ---------------------------
    @app.post("/api/coach/analyze")
    @jwt_required()
    def coach_analyze():
        payload = request.get_json(force=True, silent=True) or {}
        transcript = (payload.get("transcript") or "").strip()
        language = (payload.get("language") or "en").strip()[:20]
        duration_ms = int(payload.get("duration_ms") or 0)
        prompt_type = (payload.get("prompt_type") or "explain_concept").strip()[:40]

        if not transcript or len(transcript) < 10:
            return jsonify({"error": "Transcript too short"}), 400

        words = re.findall(r"\b[\w']+\b", transcript)
        word_count = len(words)
        minutes = max(0.05, duration_ms / 60000.0) if duration_ms else max(0.05, word_count / 130.0)
        wpm = word_count / minutes

        # Language-aware filler sets (extendable).
        filler_sets = {
            "en": ["um", "uh", "like", "actually", "basically", "you know"],
            "hi": ["umm", "मतलब", "अच्छा", "तो", "यानि", "जैसे"],
            "te": ["అంటే", "అలాగే", "అది", "ఉమ్"],
            "ta": ["அதாவது", "உம்", "மாதிரி"],
            "kn": ["ಅಂದರೆ", "ಉಮ್", "ಹಾಗೆ"],
            "ml": ["അത്", "ഉം", "പോലെ"],
            "mr": ["म्हणजे", "असं", "उम्"],
            "bn": ["মানে", "উম", "যেমন"],
        }
        fillers = filler_sets.get(language, filler_sets["en"])
        filler_pattern = r"\b(" + "|".join(re.escape(f) for f in fillers) + r")\b"
        filler = re.findall(filler_pattern, transcript.lower())
        filler_count = len(filler)
        filler_rate = filler_count / max(1, word_count)

        sentences = re.split(r"[.!?]+", transcript)
        sentences = [s.strip() for s in sentences if s.strip()]
        avg_sentence_len = word_count / max(1, len(sentences))

        # Lightweight, deterministic feedback (no external LLM required).
        strengths = []
        improvements = []

        if 110 <= wpm <= 160:
            strengths.append("Good speaking pace")
        elif wpm < 110:
            improvements.append("Speak slightly faster to maintain engagement")
        else:
            improvements.append("Slow down slightly to improve clarity")

        if filler_rate < 0.02:
            strengths.append("Low filler word usage")
        else:
            improvements.append("Reduce filler words (pause silently instead)")

        if avg_sentence_len <= 18:
            strengths.append("Clear sentence length")
        else:
            improvements.append("Use shorter sentences for better clarity")

        structure_hint = (
            "Use a simple structure: 1) Definition, 2) Key parts, 3) Example, 4) Summary."
            if prompt_type == "explain_concept"
            else "Use STAR: Situation, Task, Action, Result."
        )
        improvements.append(structure_hint)

        score = 0.0
        score += max(0, 1 - abs(wpm - 135) / 90) * 0.45
        score += max(0, 1 - min(0.12, filler_rate) / 0.12) * 0.35
        score += max(0, 1 - max(0, avg_sentence_len - 18) / 20) * 0.20
        score = max(0.0, min(1.0, score))

        return jsonify(
            {
                "language": language,
                "metrics": {
                    "word_count": word_count,
                    "duration_ms": duration_ms,
                    "wpm": round(wpm, 1),
                    "filler_count": filler_count,
                    "filler_rate": round(filler_rate, 4),
                    "avg_sentence_len": round(avg_sentence_len, 1),
                },
                "score": round(score, 3),
                "strengths": strengths[:4],
                "improvements": improvements[:6],
            }
        )

    return app


# ---------------------------
# Socket.IO peer room sync
# ---------------------------
@socketio.on("join_room")
def on_join_room(data):
    code = (data or {}).get("code", "")
    code = str(code).strip().upper()
    if not code:
        emit("error", {"error": "Missing code"})
        return
    join_room(code)
    emit("system", {"message": "Joined room", "code": code})


@socketio.on("state_update")
def on_state_update(data):
    payload = data or {}
    code = str(payload.get("code") or "").strip().upper()
    state = payload.get("state") or {}
    if not code:
        emit("error", {"error": "Missing code"})
        return
    emit("state_update", {"code": code, "state": state, "ts": _now_ms()}, room=code, include_self=False)


@socketio.on("chat")
def on_chat(data):
    payload = data or {}
    code = str(payload.get("code") or "").strip().upper()
    message = str(payload.get("message") or "").strip()[:800]
    sender = str(payload.get("sender") or "peer").strip()[:40]
    if not code or not message:
        return
    emit("chat", {"code": code, "sender": sender, "message": message, "ts": _now_ms()}, room=code)


if __name__ == "__main__":
    app = create_app()
    port = int(os.environ.get("EDUVERSE_PLATFORM_PORT", "5001"))
    socketio.run(app, host="0.0.0.0", port=port)

