# CLIP Research Upgrade Guide

This guide is for paper-grade evidence that fine-tuning CLIP improves EduVerse and that random images are rejected deterministically.

## 1) Dataset Protocol (Real World)

Prepare folders in ImageFolder format:

- `data/clip_realworld/train/<class_name>/*.jpg`
- `data/clip_realworld/val/<class_name>/*.jpg`
- `data/clip_realworld/test/<class_name>/*.jpg`
- `data/clip_realworld_ood/*.jpg` for unrelated images (e.g., medicine packets, random household objects).

Rules:

- Use real camera captures, not synthetic renders.
- Keep capture conditions varied: indoor/outdoor, occlusion, blur, angle changes.
- Minimum recommended size: 200+ images/class for train, 50+ for val, 50+ for test.

## 2) Fine-Tune CLIP Parameters

Run:

```bash
python notebooks/clip_finetune_eval.py \
  --dataset-root data/clip_realworld \
  --output-dir notebooks/clip_results \
  --epochs 12 \
  --unfreeze-visual-blocks 2
```

Outputs generated:

- `notebooks/clip_results/summary.json`
- `notebooks/clip_results/history.csv`
- `notebooks/clip_results/loss_curves.png`
- `notebooks/clip_results/val_metrics.png`
- `notebooks/clip_results/confusion_matrix.png`

These are direct figures/tables for your paper.

## 3) Real-World Deterministic/OOD Benchmark

Run:

```bash
python notebooks/clip_realworld_benchmark.py \
  --model-dir scca_finetuned \
  --in-domain-dir data/clip_realworld/test \
  --ood-dir data/clip_realworld_ood \
  --output-dir notebooks/clip_realworld_report \
  --min-confidence 0.56 \
  --min-gap 0.10
```

Outputs generated:

- `notebooks/clip_realworld_report/realworld_summary.json`
- `notebooks/clip_realworld_report/realworld_predictions.json`
- `notebooks/clip_realworld_report/realworld_metrics.png`

Key claims you can report:

- In-domain classification accuracy.
- Deterministic accept rate on valid inputs.
- Rejection rate on random/OOD inputs.

## 4) Production Integration Notes

The app now includes deterministic gating in both layers:

- Backend: `scca_server.py` returns `requires_concept_confirmation` when confidence/margin are weak.
- Frontend: AR pipeline blocks uncertain image-only predictions and asks for explicit concept input.

## 5) Paper Wording (Safe)

Use this claim style:

- "We fine-tuned the last visual transformer blocks and projection head of CLIP on a real-world EduVerse dataset."
- "We enforce deterministic thresholds using top-1 confidence and top-1/top-2 margin before AR rendering."
- "OOD/random images are rejected or routed to user concept confirmation instead of forced hallucinated AR output."

Avoid claiming full CLIP pretraining from scratch unless actually done.
