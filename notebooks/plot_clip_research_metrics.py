import argparse
import json
from pathlib import Path

import matplotlib.pyplot as plt
import pandas as pd


def main():
    parser = argparse.ArgumentParser(description="Plot CLIP fine-tuning metrics for paper figures")
    parser.add_argument("--metrics-csv", required=True)
    parser.add_argument("--summary-json", required=True)
    parser.add_argument("--output-dir", default="notebooks/clip_research_outputs")
    args = parser.parse_args()

    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    df = pd.read_csv(args.metrics_csv)
    with open(args.summary_json, "r", encoding="utf-8") as f:
        summary = json.load(f)

    fig, axes = plt.subplots(1, 3, figsize=(18, 5))

    axes[0].plot(df["epoch"], df["train_loss"], marker="o", color="#ef4444")
    axes[0].set_title("Training Loss")
    axes[0].set_xlabel("Epoch")
    axes[0].set_ylabel("Loss")
    axes[0].grid(alpha=0.3)

    axes[1].plot(df["epoch"], df["val_top1_accuracy"], marker="o", label="Top-1 Accuracy", color="#3b82f6")
    axes[1].plot(df["epoch"], df["val_deterministic_accuracy"], marker="s", label="Deterministic Accuracy", color="#10b981")
    axes[1].set_title("Validation Accuracy")
    axes[1].set_xlabel("Epoch")
    axes[1].set_ylabel("Accuracy")
    axes[1].set_ylim(0, 1)
    axes[1].grid(alpha=0.3)
    axes[1].legend()

    axes[2].plot(df["epoch"], df["val_deterministic_coverage"], marker="o", label="Coverage", color="#f59e0b")
    axes[2].plot(df["epoch"], df["val_rejection_rate"], marker="s", label="Rejection Rate", color="#8b5cf6")
    axes[2].set_title("Deterministic Gating Behavior")
    axes[2].set_xlabel("Epoch")
    axes[2].set_ylabel("Ratio")
    axes[2].set_ylim(0, 1)
    axes[2].grid(alpha=0.3)
    axes[2].legend()

    fig.suptitle("EduVerse CLIP Fine-Tuning Research Metrics", fontsize=14)
    fig.tight_layout()

    out_png = output_dir / "clip_research_metrics.png"
    fig.savefig(out_png, dpi=220)

    test = summary.get("test_metrics", {})
    print("Saved figure:", out_png)
    print("Test metrics:")
    for key, val in test.items():
        print(f"  {key}: {val}")


if __name__ == "__main__":
    main()
