Manual Browser Test Checklist

Prerequisites
- Start backend: activate your venv and run `python scca_server.py` from project root.
- Start frontend: `npm install` then `npm run dev` (Vite).
- Open the Vite dev URL (e.g. http://localhost:5173) and navigate to the AR Learning page.

Test Steps
1. Camera permissions
   - Allow camera access when prompted.
   - Verify preview shows live webcam feed.

2. Teach This Concept
   - Upload an image or use the live preview and click `Teach This Concept`.
   - Expect a toast: "Learned \"<concept>\" (samples=N)" or an error toast.
   - Confirm `learned_concepts.json` in project root updated with the concept profile.

3. Auto-Model Retrieval & Wall Projection
   - After teach success, the system should auto-retrieve a 3D model and project it to the wall.
   - If a wall is visible, model should render anchored to the wall plane and presentation controls appear.
   - If projection fails, check browser console for `ARWallDetector` messages and backend logs for `/learn-concept` and `/predict`.

4. Presentation Controls
   - Use `Prev`, `Next`, `Explode`, `Rotate`, `Exit` controls and verify interactions work.

5. Feedback Flow
   - Use the feedback widget (or run `python scripts/test_feedback.py`) to post positive/negative feedback.
   - Confirm `/feedback` returns success and `learned_concepts.json` reflects any changes after refinement.

6. Edge Cases & Quality
   - Teach with very small / blurry images to verify visual-quality warnings appear.
   - Teach with multiple distinct images (>=3) to test clustering fallback behavior.

Diagnostics
- Backend logs: watch for `/learn-concept`, `/predict`, and `AdaptiveConceptLearner` messages.
- Browser console: inspect Three.js logs and `ARWallDetector` outputs.

Notes
- Restart the Flask server after code edits.
- Install `scikit-learn` (`pip install scikit-learn`) for better KMeans behavior (optional).
- Ensure FAISS index and `scca_finetuned` exist for full predict/retrieval.
