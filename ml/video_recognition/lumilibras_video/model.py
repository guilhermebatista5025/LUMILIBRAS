from __future__ import annotations

from torch import nn
from torchvision.models import ResNet18_Weights, resnet18


class SkeletonClassifier(nn.Module):
    """ResNet com normalização embutida para manter Python e ONNX idênticos."""

    def __init__(self, class_count: int, pretrained: bool = True):
        super().__init__()
        weights = ResNet18_Weights.DEFAULT if pretrained else None
        self.backbone = resnet18(weights=weights)
        features = self.backbone.fc.in_features
        self.backbone.fc = nn.Sequential(
            nn.LayerNorm(features),
            nn.Linear(features, 128),
            nn.ReLU(),
            nn.Dropout(0.4),
            nn.Linear(128, class_count),
        )
        self.register_buffer(
            "mean", self.backbone.conv1.weight.new_tensor([0.485, 0.456, 0.406]).view(1, 3, 1, 1)
        )
        self.register_buffer(
            "std", self.backbone.conv1.weight.new_tensor([0.229, 0.224, 0.225]).view(1, 3, 1, 1)
        )

    def forward(self, image):
        return self.backbone((image - self.mean) / self.std)


def build_model(class_count: int, pretrained: bool = True) -> nn.Module:
    return SkeletonClassifier(class_count, pretrained)
