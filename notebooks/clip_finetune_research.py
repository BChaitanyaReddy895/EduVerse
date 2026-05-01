import argparse
import csv
import json
import math
import os
import random
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

import torch
from PIL import Image
from torch import nn
from torch.optim import AdamW
from torch.utils.data import DataLoader, Dataset
from transformers import CLIPModel, CLIPProcessor


@dataclass
class Sample:
    image_path: Path
    label: str


class FolderConceptDataset(Dataset):
    def __init__(self, samples: List[Sample], processor: CLIPProcessor, prompt_template: str):
        self.samples = samples
        self.processor = processor
        self.prompt_template = prompt_template

    def __len__(self):
        return len(self.samples)

    def __getitem__(self, index):
        sample = self.samples[index]
        image = Image.open(sample.image_path).convert("RGB")
        text = self.prompt_template.format(label=sample.label.replace("_", " "))
        return image, text, sample.label


def collate_fn(batch, processor: CLIPProcessor):
    images, texts, labels = zip(*batch)
    encoded = processor(text=list(texts), images=list(images), return_tensors="pt", padding=True, truncation=True)
    return encoded, list(labels)


def build_samples(dataset_root: Path) -> List[Sample]:
    samples: List[Sample] = []
    for class_dir in sorted(dataset_root.iterdir()):
        if not class_dir.is_dir():
            continue
        label = class_dir.name.lower().strip()
        for file_path in class_dir.rglob("*"):
            if file_path.suffix.lower() in {".png", ".jpg", ".jpeg", ".webp", ".bmp"}:
                samples.append(Sample(file_path, label))
    return samples


def split_samples(samples: List[Sample], train_ratio: float, val_ratio: float, seed: int):
    rng = random.Random(seed)
    shuffled = samples[:]
    rng.shuffle(shuffled)

    n = len(shuffled)
    n_train = int(n * train_ratio)
    n_val = int(n * val_ratio)

    train = shuffled[:n_train]
    val = shuffled[n_train:n_train + n_val]
    test = shuffled[n_train + n_val:]
    return train, val, test


def build_label_index(samples: List[Sample]) -> Dict[str, int]:
    labels = sorted({s.label for s in samples})
    return {label: i for i, label in enumerate(labels)}


def logits_for_batch(model: CLIPModel, encoded: Dict[str, torch.Tensor]):
    outputs = model(**encoded)
    image_embeds = outputs.image_embeds
    text_embeds = outputs.text_embeds

    image_embeds = image_embeds / image_embeds.norm(dim=-1, keepdim=True)
    text_embeds = text_embeds / text_embeds.norm(dim=-1, keepdim=True)

    temperature = model.logit_scale.exp()
    logits = temperature * image_embeds @ text_embeds.t()
    return logits


def train_one_epoch(model, loader, optimizer, device):
    model.train()
    criterion = nn.CrossEntropyLoss()

    running_loss = 0.0
    running_correct = 0
    running_total = 0

    for encoded, labels in loader:
        encoded = {k: v.to(device) for k, v in encoded.items()}
        optimizer.zero_grad()

        logits_i2t = logits_for_batch(model, encoded)
        logits_t2i = logits_i2t.t()
        targets = torch.arange(logits_i2t.size(0), device=device)

        loss = 0.5 * (criterion(logits_i2t, targets) + criterion(logits_t2i, targets))
        loss.backward()
        optimizer.step()

        running_loss += loss.item() * logits_i2t.size(0)
        preds = logits_i2t.argmax(dim=1)
        running_correct += (preds == targets).sum().item()
        running_total += logits_i2t.size(0)

    avg_loss = running_loss / max(1, running_total)
    avg_acc = running_correct / max(1, running_total)
    return avg_loss, avg_acc


def evaluate(model, loader, label_to_index: Dict[str, int], processor: CLIPProcessor, device, min_conf=0.56, min_gap=0.10):
    model.eval()
    labels_sorted = [x for x, _ in sorted(label_to_index.items(), key=lambda kv: kv[1])]
    class_prompts = [f"a photo of {label.replace('_', ' ')}" for label in labels_sorted]

    with torch.no_grad():
        text_encoded = processor(text=class_prompts, return_tensors="pt", padding=True, truncation=True)
        text_encoded = {k: v.to(device) for k, v in text_encoded.items()}
        text_features = model.get_text_features(**text_encoded)
        text_features = text_features / text_features.norm(dim=-1, keepdim=True)

    total = 0
    correct = 0
    deterministic_total = 0
    deterministic_correct = 0
    rejected = 0

    for encoded, labels in loader:
        image_inputs = {k: v.to(device) for k, v in encoded.items() if k.startswith("pixel_values")}

        with torch.no_grad():
            image_features = model.get_image_features(**image_inputs)
            image_features = image_features / image_features.norm(dim=-1, keepdim=True)
            logits = image_features @ text_features.t()

        probs = torch.softmax(logits, dim=-1)
        top2 = torch.topk(probs, k=min(2, probs.size(1)), dim=-1)
        pred_idx = top2.indices[:, 0]

        for i, true_label in enumerate(labels):
            total += 1
            pred_label = labels_sorted[pred_idx[i].item()]
            if pred_label == true_label:
                correct += 1

            top1 = top2.values[i][0].item()
            top2v = top2.values[i][1].item() if top2.values.size(1) > 1 else 0.0
            gap = top1 - top2v
            deterministic = top1 >= min_conf and gap >= min_gap

            if deterministic:
                deterministic_total += 1
                if pred_label == true_label:
                    deterministic_correct += 1
            else:
                rejected += 1

    return {
        "top1_accuracy": correct / max(1, total),
        "deterministic_coverage": deterministic_total / max(1, total),
        "deterministic_accuracy": deterministic_correct / max(1, deterministic_total),
        "rejection_rate": rejected / max(1, total),
        "total_samples": total,
    }


def main():
    parser = argparse.ArgumentParser(description="Fine-tune CLIP and export research metrics for EduVerse")
    parser.add_argument("--dataset-root", required=True, help="Folder dataset: one subfolder per class")
    parser.add_argument("--output-dir", default="notebooks/clip_research_outputs", help="Output dir for checkpoints/metrics")
    parser.add_argument("--base-model", default="openai/clip-vit-base-patch16")
    parser.add_argument("--epochs", type=int, default=5)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=5e-6)
    parser.add_argument("--weight-decay", type=float, default=0.01)
    parser.add_argument("--train-ratio", type=float, default=0.7)
    parser.add_argument("--val-ratio", type=float, default=0.15)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--min-confidence", type=float, default=0.56)
    parser.add_argument("--min-gap", type=float, default=0.10)
    parser.add_argument("--prompt-template", default="a photo of {label}")
    args = parser.parse_args()

    random.seed(args.seed)
    torch.manual_seed(args.seed)

    dataset_root = Path(args.dataset_root)
    out_dir = Path(args.output_dir)
    out_dir.mkdir(parents=True, exist_ok=True)

    samples = build_samples(dataset_root)
    if len(samples) < 10:
        raise RuntimeError("Dataset too small. Provide at least 10 images across classes.")

    train_samples, val_samples, test_samples = split_samples(samples, args.train_ratio, args.val_ratio, args.seed)
    label_to_index = build_label_index(samples)

    processor = CLIPProcessor.from_pretrained(args.base_model)
    model = CLIPModel.from_pretrained(args.base_model)

    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device)

    train_ds = FolderConceptDataset(train_samples, processor, args.prompt_template)
    val_ds = FolderConceptDataset(val_samples, processor, args.prompt_template)
    test_ds = FolderConceptDataset(test_samples, processor, args.prompt_template)

    train_loader = DataLoader(train_ds, batch_size=args.batch_size, shuffle=True, collate_fn=lambda b: collate_fn(b, processor))
    val_loader = DataLoader(val_ds, batch_size=args.batch_size, shuffle=False, collate_fn=lambda b: collate_fn(b, processor))
    test_loader = DataLoader(test_ds, batch_size=args.batch_size, shuffle=False, collate_fn=lambda b: collate_fn(b, processor))

    optimizer = AdamW(model.parameters(), lr=args.lr, weight_decay=args.weight_decay)

    history = []
    best_val = -math.inf
    best_checkpoint_dir = out_dir / "best_model"

    for epoch in range(1, args.epochs + 1):
        train_loss, train_acc = train_one_epoch(model, train_loader, optimizer, device)
        val_metrics = evaluate(model, val_loader, label_to_index, processor, device, args.min_confidence, args.min_gap)

        row = {
            "epoch": epoch,
            "train_loss": train_loss,
            "train_batch_alignment_acc": train_acc,
            "val_top1_accuracy": val_metrics["top1_accuracy"],
            "val_deterministic_accuracy": val_metrics["deterministic_accuracy"],
            "val_deterministic_coverage": val_metrics["deterministic_coverage"],
            "val_rejection_rate": val_metrics["rejection_rate"],
        }
        history.append(row)

        score = val_metrics["deterministic_accuracy"]
        if score > best_val:
            best_val = score
            best_checkpoint_dir.mkdir(parents=True, exist_ok=True)
            model.save_pretrained(best_checkpoint_dir)
            processor.save_pretrained(best_checkpoint_dir)

    test_metrics = evaluate(model, test_loader, label_to_index, processor, device, args.min_confidence, args.min_gap)

    csv_path = out_dir / "training_metrics.csv"
    with csv_path.open("w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=list(history[0].keys()))
        writer.writeheader()
        writer.writerows(history)

    summary = {
        "base_model": args.base_model,
        "seed": args.seed,
        "dataset_root": str(dataset_root),
        "counts": {
            "total": len(samples),
            "train": len(train_samples),
            "val": len(val_samples),
            "test": len(test_samples),
            "classes": len(label_to_index),
        },
        "deterministic_thresholds": {
            "min_confidence": args.min_confidence,
            "min_top_gap": args.min_gap,
        },
        "test_metrics": test_metrics,
        "best_model_dir": str(best_checkpoint_dir),
        "metrics_csv": str(csv_path),
    }

    with (out_dir / "summary.json").open("w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    print("Saved:")
    print(f"- {csv_path}")
    print(f"- {out_dir / 'summary.json'}")
    print(f"- {best_checkpoint_dir}")


if __name__ == "__main__":
    main()
