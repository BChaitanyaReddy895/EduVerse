import argparse
import json
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import torch
from PIL import Image
from torchvision import transforms
from transformers import CLIPModel, CLIPProcessor


def collect_images(folder: Path):
    return [p for p in folder.rglob("*") if p.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}]


def main():
    parser = argparse.ArgumentParser(description="Benchmark deterministic behavior on in-domain and out-of-domain images.")
    parser.add_argument("--model-dir", default="scca_finetuned", help="Fine-tuned CLIP directory or HF model id.")
    parser.add_argument("--in-domain-dir", required=True, help="Folder with class subfolders of valid concepts.")
    parser.add_argument("--ood-dir", required=True, help="Folder with random/irrelevant images.")
    parser.add_argument("--output-dir", default="notebooks/clip_realworld_report")
    parser.add_argument("--topk", type=int, default=3)
    parser.add_argument("--min-confidence", type=float, default=0.56)
    parser.add_argument("--min-gap", type=float, default=0.10)
    args = parser.parse_args()

    out = Path(args.output_dir)
    out.mkdir(parents=True, exist_ok=True)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = CLIPModel.from_pretrained(args.model_dir).to(device)
    processor = CLIPProcessor.from_pretrained("openai/clip-vit-base-patch16")
    model.eval()

    in_domain_root = Path(args.in_domain_dir)
    classes = sorted([d.name for d in in_domain_root.iterdir() if d.is_dir()])
    prompts = [f"a photo of {c}" for c in classes]

    text_inputs = processor(text=prompts, return_tensors="pt", padding=True).to(device)
    with torch.no_grad():
      text_features = model.get_text_features(**text_inputs)
      text_features = text_features / text_features.norm(dim=-1, keepdim=True)

    tfm = transforms.Compose([transforms.Resize((224, 224))])

    def score_image(image_path: Path):
        img = Image.open(image_path).convert("RGB")
        img = tfm(img)
        image_inputs = processor(images=img, return_tensors="pt").to(device)
        with torch.no_grad():
            image_features = model.get_image_features(**image_inputs)
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            sims = (image_features @ text_features.T).squeeze(0).cpu().numpy()

        probs = np.exp(sims) / np.sum(np.exp(sims))
        order = np.argsort(-probs)
        top1 = probs[order[0]]
        top2 = probs[order[1]] if len(order) > 1 else 0.0
        gap = top1 - top2
        deterministic = top1 >= args.min_confidence and gap >= args.min_gap
        return {
            "top_class": classes[order[0]],
            "top1": float(top1),
            "top2": float(top2),
            "gap": float(gap),
            "deterministic_pass": bool(deterministic),
        }

    in_domain_results = []
    for class_name in classes:
        class_images = collect_images(in_domain_root / class_name)
        for image_path in class_images:
            pred = score_image(image_path)
            pred["path"] = str(image_path)
            pred["label"] = class_name
            pred["correct"] = pred["top_class"] == class_name
            in_domain_results.append(pred)

    ood_results = []
    for image_path in collect_images(Path(args.ood_dir)):
        pred = score_image(image_path)
        pred["path"] = str(image_path)
        ood_results.append(pred)

    in_acc = np.mean([r["correct"] for r in in_domain_results]) if in_domain_results else 0.0
    in_det = np.mean([r["deterministic_pass"] for r in in_domain_results]) if in_domain_results else 0.0
    ood_reject = 1.0 - (np.mean([r["deterministic_pass"] for r in ood_results]) if ood_results else 0.0)

    summary = {
        "in_domain_count": len(in_domain_results),
        "ood_count": len(ood_results),
        "in_domain_accuracy": float(in_acc),
        "in_domain_deterministic_rate": float(in_det),
        "ood_rejection_rate": float(ood_reject),
        "thresholds": {
            "min_confidence": args.min_confidence,
            "min_gap": args.min_gap,
        },
    }

    with open(out / "realworld_summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    with open(out / "realworld_predictions.json", "w", encoding="utf-8") as f:
        json.dump({"in_domain": in_domain_results, "ood": ood_results}, f, indent=2)

    metrics = ["In-domain Accuracy", "Deterministic Accept (ID)", "OOD Rejection"]
    values = [summary["in_domain_accuracy"], summary["in_domain_deterministic_rate"], summary["ood_rejection_rate"]]

    plt.figure(figsize=(7, 4.5))
    bars = plt.bar(metrics, values)
    for bar, value in zip(bars, values):
        plt.text(bar.get_x() + bar.get_width() / 2, value + 0.01, f"{value:.2%}", ha="center", va="bottom")
    plt.ylim(0, 1.05)
    plt.ylabel("Rate")
    plt.title("Real-World Deterministic Benchmark")
    plt.tight_layout()
    plt.savefig(out / "realworld_metrics.png", dpi=200)
    plt.close()

    print("Saved outputs:")
    print(f"- {out / 'realworld_summary.json'}")
    print(f"- {out / 'realworld_predictions.json'}")
    print(f"- {out / 'realworld_metrics.png'}")


if __name__ == "__main__":
    main()
