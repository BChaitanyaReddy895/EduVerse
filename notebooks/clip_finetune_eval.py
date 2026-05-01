import argparse
import csv
import json
import os
import random
from dataclasses import dataclass
from pathlib import Path

import matplotlib.pyplot as plt
import numpy as np
import torch
import torch.nn as nn
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score
from torch.utils.data import DataLoader
from torchvision import datasets, transforms
from transformers import CLIPModel


CLIP_MEAN = (0.48145466, 0.4578275, 0.40821073)
CLIP_STD = (0.26862954, 0.26130258, 0.27577711)


@dataclass
class BatchResult:
    logits: np.ndarray
    probs: np.ndarray
    labels: np.ndarray


class CLIPClassifier(nn.Module):
    def __init__(self, clip_model_name: str, num_classes: int, unfreeze_visual_blocks: int):
        super().__init__()
        self.clip = CLIPModel.from_pretrained(clip_model_name)
        hidden_dim = self.clip.config.projection_dim
        self.classifier = nn.Linear(hidden_dim, num_classes)

        # Freeze everything by default.
        for p in self.clip.parameters():
            p.requires_grad = False

        # Unfreeze selected visual transformer blocks to prove parameter updates.
        visual_layers = getattr(self.clip.vision_model.encoder, "layers", [])
        if unfreeze_visual_blocks > 0:
            for layer in visual_layers[-unfreeze_visual_blocks:]:
                for p in layer.parameters():
                    p.requires_grad = True
            for p in self.clip.visual_projection.parameters():
                p.requires_grad = True

        # Always train classifier head.
        for p in self.classifier.parameters():
            p.requires_grad = True

    def forward(self, pixel_values: torch.Tensor) -> torch.Tensor:
        outputs = self.clip.get_image_features(pixel_values=pixel_values)
        outputs = outputs / outputs.norm(dim=-1, keepdim=True)
        return self.classifier(outputs)


def set_seed(seed: int) -> None:
    random.seed(seed)
    np.random.seed(seed)
    torch.manual_seed(seed)
    torch.cuda.manual_seed_all(seed)


def build_dataloaders(dataset_root: Path, batch_size: int):
    tfm = transforms.Compose(
        [
            transforms.Resize(224),
            transforms.CenterCrop(224),
            transforms.ToTensor(),
            transforms.Normalize(CLIP_MEAN, CLIP_STD),
        ]
    )

    train = datasets.ImageFolder(dataset_root / "train", transform=tfm)
    val = datasets.ImageFolder(dataset_root / "val", transform=tfm)
    test = datasets.ImageFolder(dataset_root / "test", transform=tfm)

    train_loader = DataLoader(train, batch_size=batch_size, shuffle=True, num_workers=2)
    val_loader = DataLoader(val, batch_size=batch_size, shuffle=False, num_workers=2)
    test_loader = DataLoader(test, batch_size=batch_size, shuffle=False, num_workers=2)

    return train, val, test, train_loader, val_loader, test_loader


def run_epoch(model, loader, optimizer, device, train_mode=True):
    criterion = nn.CrossEntropyLoss()
    model.train(train_mode)
    total_loss = 0.0

    all_logits = []
    all_probs = []
    all_labels = []

    for pixels, labels in loader:
        pixels = pixels.to(device)
        labels = labels.to(device)

        with torch.set_grad_enabled(train_mode):
            logits = model(pixels)
            loss = criterion(logits, labels)

        if train_mode:
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()

        probs = torch.softmax(logits, dim=1)
        total_loss += loss.item() * pixels.size(0)

        all_logits.append(logits.detach().cpu().numpy())
        all_probs.append(probs.detach().cpu().numpy())
        all_labels.append(labels.detach().cpu().numpy())

    logits_np = np.concatenate(all_logits, axis=0)
    probs_np = np.concatenate(all_probs, axis=0)
    labels_np = np.concatenate(all_labels, axis=0)

    return total_loss / len(loader.dataset), BatchResult(logits_np, probs_np, labels_np)


def evaluate(batch_result: BatchResult):
    preds = np.argmax(batch_result.probs, axis=1)
    acc = accuracy_score(batch_result.labels, preds)
    f1 = f1_score(batch_result.labels, preds, average="macro")

    top1 = np.max(batch_result.probs, axis=1)
    sorted_probs = np.sort(batch_result.probs, axis=1)
    margin = sorted_probs[:, -1] - sorted_probs[:, -2]

    return {
        "accuracy": float(acc),
        "f1_macro": float(f1),
        "mean_top1_confidence": float(top1.mean()),
        "mean_margin": float(margin.mean()),
        "predictions": preds,
    }


def save_training_curves(history, output_dir: Path):
    epochs = list(range(1, len(history["train_loss"]) + 1))

    plt.figure(figsize=(8, 4.5))
    plt.plot(epochs, history["train_loss"], label="Train Loss")
    plt.plot(epochs, history["val_loss"], label="Val Loss")
    plt.xlabel("Epoch")
    plt.ylabel("Loss")
    plt.title("CLIP Fine-Tuning Loss Curves")
    plt.grid(True, alpha=0.2)
    plt.legend()
    plt.tight_layout()
    plt.savefig(output_dir / "loss_curves.png", dpi=200)
    plt.close()

    plt.figure(figsize=(8, 4.5))
    plt.plot(epochs, history["val_acc"], label="Validation Accuracy")
    plt.plot(epochs, history["val_f1"], label="Validation F1-macro")
    plt.xlabel("Epoch")
    plt.ylabel("Score")
    plt.title("CLIP Fine-Tuning Validation Metrics")
    plt.grid(True, alpha=0.2)
    plt.legend()
    plt.tight_layout()
    plt.savefig(output_dir / "val_metrics.png", dpi=200)
    plt.close()


def save_confusion(cm: np.ndarray, class_names, output_dir: Path):
    fig, ax = plt.subplots(figsize=(8, 7))
    im = ax.imshow(cm, cmap="Blues")
    ax.set_xticks(np.arange(len(class_names)), labels=class_names, rotation=45, ha="right")
    ax.set_yticks(np.arange(len(class_names)), labels=class_names)
    ax.set_title("Test Confusion Matrix")
    fig.colorbar(im, ax=ax)
    plt.tight_layout()
    plt.savefig(output_dir / "confusion_matrix.png", dpi=200)
    plt.close(fig)


def main():
    parser = argparse.ArgumentParser(description="Fine-tune CLIP image encoder and generate paper-ready metrics.")
    parser.add_argument("--dataset-root", required=True, help="Root with train/val/test folders in ImageFolder format.")
    parser.add_argument("--output-dir", default="notebooks/clip_results", help="Directory to store models and plots.")
    parser.add_argument("--model-name", default="openai/clip-vit-base-patch16")
    parser.add_argument("--epochs", type=int, default=10)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--lr", type=float, default=3e-4)
    parser.add_argument("--weight-decay", type=float, default=1e-4)
    parser.add_argument("--unfreeze-visual-blocks", type=int, default=2)
    parser.add_argument("--seed", type=int, default=42)
    args = parser.parse_args()

    set_seed(args.seed)
    output_dir = Path(args.output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    device = "cuda" if torch.cuda.is_available() else "cpu"

    dataset_root = Path(args.dataset_root)
    train_set, val_set, test_set, train_loader, val_loader, test_loader = build_dataloaders(dataset_root, args.batch_size)

    model = CLIPClassifier(args.model_name, len(train_set.classes), args.unfreeze_visual_blocks).to(device)

    params = [p for p in model.parameters() if p.requires_grad]
    optimizer = torch.optim.AdamW(params, lr=args.lr, weight_decay=args.weight_decay)

    history = {"train_loss": [], "val_loss": [], "val_acc": [], "val_f1": []}
    best_val_acc = -1.0
    best_path = output_dir / "best_clip_finetuned.pt"

    for epoch in range(args.epochs):
        train_loss, _ = run_epoch(model, train_loader, optimizer, device, train_mode=True)
        val_loss, val_batch = run_epoch(model, val_loader, optimizer, device, train_mode=False)
        val_metrics = evaluate(val_batch)

        history["train_loss"].append(train_loss)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_metrics["accuracy"])
        history["val_f1"].append(val_metrics["f1_macro"])

        print(
            f"epoch={epoch + 1}/{args.epochs} "
            f"train_loss={train_loss:.4f} val_loss={val_loss:.4f} "
            f"val_acc={val_metrics['accuracy']:.4f} val_f1={val_metrics['f1_macro']:.4f}"
        )

        if val_metrics["accuracy"] > best_val_acc:
            best_val_acc = val_metrics["accuracy"]
            torch.save({"state_dict": model.state_dict(), "classes": train_set.classes}, best_path)

    save_training_curves(history, output_dir)

    checkpoint = torch.load(best_path, map_location=device)
    model.load_state_dict(checkpoint["state_dict"])

    _, test_batch = run_epoch(model, test_loader, optimizer=None, device=device, train_mode=False)
    test_metrics = evaluate(test_batch)

    cm = confusion_matrix(test_batch.labels, test_metrics["predictions"])
    save_confusion(cm, train_set.classes, output_dir)

    summary = {
        "dataset_root": str(dataset_root),
        "device": device,
        "model_name": args.model_name,
        "epochs": args.epochs,
        "batch_size": args.batch_size,
        "learning_rate": args.lr,
        "unfreeze_visual_blocks": args.unfreeze_visual_blocks,
        "classes": train_set.classes,
        "best_val_acc": best_val_acc,
        "test_accuracy": test_metrics["accuracy"],
        "test_f1_macro": test_metrics["f1_macro"],
        "mean_top1_confidence": test_metrics["mean_top1_confidence"],
        "mean_margin": test_metrics["mean_margin"],
    }

    with open(output_dir / "summary.json", "w", encoding="utf-8") as f:
        json.dump(summary, f, indent=2)

    with open(output_dir / "history.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["epoch", "train_loss", "val_loss", "val_acc", "val_f1"])
        for i, (tr, vl, va, vf) in enumerate(
            zip(history["train_loss"], history["val_loss"], history["val_acc"], history["val_f1"]),
            start=1,
        ):
            writer.writerow([i, tr, vl, va, vf])

    print("Saved outputs:")
    print(f"- {output_dir / 'summary.json'}")
    print(f"- {output_dir / 'history.csv'}")
    print(f"- {output_dir / 'loss_curves.png'}")
    print(f"- {output_dir / 'val_metrics.png'}")
    print(f"- {output_dir / 'confusion_matrix.png'}")


if __name__ == "__main__":
    main()
