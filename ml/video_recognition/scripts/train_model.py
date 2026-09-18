from __future__ import annotations

import argparse
import json
import random
import sys
from collections import defaultdict
from pathlib import Path

MODULE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(MODULE_ROOT))

import numpy as np
import torch
import torch.nn.functional as functional
from torch import nn
from torch.utils.data import DataLoader, Dataset

from lumilibras_video.features import sequence_to_image
from lumilibras_video.model import build_model


class FeatureDataset(Dataset):
    def __init__(self, files: list[Path], labels: list[str]):
        self.files = files
        self.labels = labels

    def __len__(self) -> int:
        return len(self.files)

    def __getitem__(self, index: int):
        with np.load(self.files[index]) as saved:
            image = sequence_to_image(saved["sequence"])
            label = str(saved["label"])
        tensor = torch.from_numpy(image).unsqueeze(0)
        tensor = functional.interpolate(tensor, size=(224, 224), mode="bilinear", align_corners=False)[0]
        return tensor, self.labels.index(label)


def metadata(path: Path) -> tuple[str, str, str]:
    with np.load(path) as saved:
        return str(saved["activity"]), str(saved["label"]), str(saved["signer"])


def split_by_signer(files: list[Path], seed: int) -> tuple[list[Path], list[Path], list[str]]:
    info = {path: metadata(path) for path in files}
    labels = sorted({item[1] for item in info.values()})
    signers = sorted({item[2] for item in info.values()})
    if len(signers) < 2:
        raise ValueError("São necessárias ao menos duas pessoas para treino e validação")
    random.Random(seed).shuffle(signers)
    validation_count = max(1, round(len(signers) * 0.2))
    validation_signers = set(signers[:validation_count])
    train = [path for path in files if info[path][2] not in validation_signers]
    validation = [path for path in files if info[path][2] in validation_signers]
    for label in labels:
        if not any(info[path][1] == label for path in train):
            raise ValueError(f"A classe {label} não aparece no conjunto de treino")
        if not any(info[path][1] == label for path in validation):
            raise ValueError(f"A classe {label} não aparece na validação; grave mais pessoas")
    return train, validation, labels


def run_epoch(model, loader, loss_function, device, optimizer=None):
    training = optimizer is not None
    model.train(training)
    total_loss = correct = total = 0
    for images, expected in loader:
        images, expected = images.to(device), expected.to(device)
        if training:
            optimizer.zero_grad()
        with torch.set_grad_enabled(training):
            output = model(images)
            loss = loss_function(output, expected)
            if training:
                loss.backward()
                optimizer.step()
        total_loss += loss.item() * len(expected)
        correct += (output.argmax(1) == expected).sum().item()
        total += len(expected)
    return total_loss / total, correct / total


def main() -> int:
    parser = argparse.ArgumentParser(description="Treina um classificador temporal por atividade")
    parser.add_argument("--features", type=Path, default=MODULE_ROOT / "data" / "features")
    parser.add_argument("--artifacts", type=Path, default=MODULE_ROOT / "artifacts")
    parser.add_argument("--activity", help="Treina somente esta atividade")
    parser.add_argument("--epochs", type=int, default=30)
    parser.add_argument("--batch-size", type=int, default=16)
    parser.add_argument("--seed", type=int, default=42)
    parser.add_argument("--no-pretrained", action="store_true")
    args = parser.parse_args()

    all_files = sorted(args.features.rglob("*.npz"))
    grouped: dict[str, list[Path]] = defaultdict(list)
    for path in all_files:
        activity, _, _ = metadata(path)
        if not args.activity or activity == args.activity:
            grouped[activity].append(path)
    if not grouped:
        print("Nenhuma feature encontrada. Execute extract_landmarks.py primeiro.")
        return 1

    random.seed(args.seed)
    np.random.seed(args.seed)
    torch.manual_seed(args.seed)
    device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
    print(f"Dispositivo: {device}")

    for activity, files in sorted(grouped.items()):
        train_files, validation_files, labels = split_by_signer(files, args.seed)
        print(f"\n{activity}: {len(train_files)} treino, {len(validation_files)} validação")
        print(f"Classes: {', '.join(labels)}")
        train_loader = DataLoader(FeatureDataset(train_files, labels), args.batch_size, shuffle=True)
        validation_loader = DataLoader(FeatureDataset(validation_files, labels), args.batch_size)
        model = build_model(len(labels), pretrained=not args.no_pretrained).to(device)
        optimizer = torch.optim.AdamW(model.parameters(), lr=1e-4, weight_decay=1e-4)
        loss_function = nn.CrossEntropyLoss()
        best_accuracy = -1.0
        activity_dir = args.artifacts / activity
        activity_dir.mkdir(parents=True, exist_ok=True)

        for epoch in range(1, args.epochs + 1):
            train_loss, train_accuracy = run_epoch(model, train_loader, loss_function, device, optimizer)
            validation_loss, validation_accuracy = run_epoch(model, validation_loader, loss_function, device)
            print(
                f"época {epoch:03d} | treino {train_loss:.4f}/{train_accuracy:.1%} "
                f"| validação {validation_loss:.4f}/{validation_accuracy:.1%}"
            )
            if validation_accuracy > best_accuracy:
                best_accuracy = validation_accuracy
                torch.save({
                    "activity": activity,
                    "labels": labels,
                    "state_dict": model.state_dict(),
                    "validation_accuracy": best_accuracy,
                }, activity_dir / "model.pt")

        (activity_dir / "labels.json").write_text(
            json.dumps({"activity": activity, "labels": labels}, ensure_ascii=False, indent=2) + "\n",
            encoding="utf-8",
        )
        print(f"Melhor validação de {activity}: {best_accuracy:.1%}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
