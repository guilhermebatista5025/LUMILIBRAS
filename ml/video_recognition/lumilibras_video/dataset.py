from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path

VIDEO_EXTENSIONS = {".avi", ".m4v", ".mkv", ".mov", ".mp4", ".webm"}


@dataclass(frozen=True)
class VideoSample:
    path: Path
    activity: str
    label: str
    signer: str

    @property
    def sample_id(self) -> str:
        relative = f"{self.activity}/{self.label}/{self.signer}/{self.path.stem}"
        return relative.replace(" ", "-").lower()


def discover_videos(root: Path) -> list[VideoSample]:
    """Lê data/videos/<atividade>/<sinal>/<pessoa>/<arquivo>.mp4."""
    root = root.resolve()
    if not root.exists():
        return []

    samples: list[VideoSample] = []
    for path in sorted(root.rglob("*")):
        if not path.is_file() or path.suffix.lower() not in VIDEO_EXTENSIONS:
            continue
        relative = path.relative_to(root)
        if len(relative.parts) != 4:
            raise ValueError(
                f"Estrutura inválida: {relative}. Esperado: atividade/sinal/pessoa/video.ext"
            )
        activity, label, signer, _ = relative.parts
        samples.append(VideoSample(path, activity, label, signer))
    return samples
