from __future__ import annotations

import argparse
import sys
from pathlib import Path

MODULE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(MODULE_ROOT))

import torch

from lumilibras_video.model import build_model


def main() -> int:
    parser = argparse.ArgumentParser(description="Exporta o modelo temporal treinado para ONNX")
    parser.add_argument("activity")
    parser.add_argument("--artifacts", type=Path, default=MODULE_ROOT / "artifacts")
    args = parser.parse_args()

    directory = args.artifacts / args.activity
    checkpoint_path = directory / "model.pt"
    if not checkpoint_path.exists():
        print(f"Modelo não encontrado: {checkpoint_path}")
        return 1
    checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=True)
    model = build_model(len(checkpoint["labels"]), pretrained=False)
    model.load_state_dict(checkpoint["state_dict"])
    model.eval()
    destination = directory / "model.onnx"
    torch.onnx.export(
        model,
        torch.zeros(1, 3, 224, 224),
        destination,
        input_names=["skeleton_image"],
        output_names=["logits"],
        dynamic_axes={"skeleton_image": {0: "batch"}, "logits": {0: "batch"}},
        opset_version=17,
    )
    print(f"Modelo exportado para {destination}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
