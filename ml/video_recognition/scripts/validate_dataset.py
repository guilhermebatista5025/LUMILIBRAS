from __future__ import annotations

import argparse
import sys
from collections import Counter, defaultdict
from pathlib import Path

MODULE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(MODULE_ROOT))

from lumilibras_video.dataset import discover_videos


def main() -> int:
    parser = argparse.ArgumentParser(description="Valida a organização dos vídeos de Libras")
    parser.add_argument("--videos", type=Path, default=MODULE_ROOT / "data" / "videos")
    args = parser.parse_args()

    try:
        samples = discover_videos(args.videos)
    except ValueError as error:
        print(f"ERRO: {error}")
        return 1

    if not samples:
        print(f"Nenhum vídeo encontrado em {args.videos.resolve()}")
        print("Consulte ml/video_recognition/README.md para ver a estrutura esperada.")
        return 0

    by_activity: dict[str, list] = defaultdict(list)
    for sample in samples:
        by_activity[sample.activity].append(sample)

    problems = []
    for activity, activity_samples in sorted(by_activity.items()):
        print(f"\n{activity}: {len(activity_samples)} vídeos")
        counts = Counter((sample.label, sample.signer) for sample in activity_samples)
        labels = sorted({sample.label for sample in activity_samples})
        signers = sorted({sample.signer for sample in activity_samples})
        print(f"  classes: {', '.join(labels)}")
        print(f"  pessoas: {', '.join(signers)}")
        if len(signers) < 2:
            problems.append(f"{activity}: requer ao menos duas pessoas para separar validação")
        if "nao-sinal" not in labels:
            problems.append(f"{activity}: falta a classe obrigatória nao-sinal")
        for label in labels:
            label_signers = {signer for current_label, signer in counts if current_label == label}
            if len(label_signers) < 2:
                problems.append(f"{activity}/{label}: aparece para menos de duas pessoas")
            total = sum(value for (current_label, _), value in counts.items() if current_label == label)
            print(f"  - {label}: {total} vídeos de {len(label_signers)} pessoas")

    if problems:
        print("\nPendências:")
        for problem in problems:
            print(f"  - {problem}")
        return 2

    print("\nDataset pronto para a extração inicial.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
