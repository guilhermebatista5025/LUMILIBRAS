from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

MODULE_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(MODULE_ROOT))

import cv2
import mediapipe as mp
import numpy as np

from lumilibras_video.dataset import VideoSample, discover_videos
from lumilibras_video.features import HAND_POINTS, POINT_COUNT, TARGET_FRAMES, resample_sequence


def _empty_frame() -> np.ndarray:
    return np.zeros((POINT_COUNT, 4), dtype=np.float32)


def _landmarks_to_frame(results) -> np.ndarray:
    frame = _empty_frame()
    if results.pose_landmarks:
        for index, point in enumerate(results.pose_landmarks.landmark):
            frame[index] = (point.x, point.y, point.z, point.visibility)

    hand_offset = 33
    for landmarks, offset in (
        (results.left_hand_landmarks, hand_offset),
        (results.right_hand_landmarks, hand_offset + HAND_POINTS),
    ):
        if landmarks:
            for index, point in enumerate(landmarks.landmark):
                frame[offset + index] = (point.x, point.y, point.z, 1.0)
    return frame


def extract_video(sample: VideoSample, holistic) -> tuple[np.ndarray, float]:
    capture = cv2.VideoCapture(str(sample.path))
    if not capture.isOpened():
        raise RuntimeError("OpenCV não conseguiu abrir o vídeo")

    frames = []
    frames_with_hands = 0
    try:
        while True:
            ok, image = capture.read()
            if not ok:
                break
            rgb = cv2.cvtColor(image, cv2.COLOR_BGR2RGB)
            results = holistic.process(rgb)
            frame = _landmarks_to_frame(results)
            frames.append(frame)
            if np.any(frame[33:, 3] > 0):
                frames_with_hands += 1
    finally:
        capture.release()

    if not frames:
        raise RuntimeError("vídeo sem frames decodificáveis")
    coverage = frames_with_hands / len(frames)
    return resample_sequence(np.stack(frames), TARGET_FRAMES), coverage


def output_path(root: Path, sample: VideoSample) -> Path:
    return root / sample.activity / sample.label / sample.signer / f"{sample.path.stem}.npz"


def main() -> int:
    parser = argparse.ArgumentParser(description="Extrai landmarks temporais dos vídeos")
    parser.add_argument("--videos", type=Path, default=MODULE_ROOT / "data" / "videos")
    parser.add_argument("--output", type=Path, default=MODULE_ROOT / "data" / "features")
    parser.add_argument("--overwrite", action="store_true")
    args = parser.parse_args()

    samples = discover_videos(args.videos)
    if not samples:
        print("Nenhum vídeo encontrado. Consulte o README desta pasta.")
        return 0

    manifest = []
    failures = 0
    with mp.solutions.holistic.Holistic(
        static_image_mode=False,
        model_complexity=1,
        smooth_landmarks=True,
        refine_face_landmarks=False,
        min_detection_confidence=0.5,
        min_tracking_confidence=0.5,
    ) as holistic:
        for index, sample in enumerate(samples, start=1):
            destination = output_path(args.output, sample)
            print(f"[{index}/{len(samples)}] {sample.sample_id}")
            try:
                if destination.exists() and not args.overwrite:
                    with np.load(destination) as saved:
                        coverage = float(saved["hand_coverage"])
                else:
                    sequence, coverage = extract_video(sample, holistic)
                    destination.parent.mkdir(parents=True, exist_ok=True)
                    np.savez_compressed(
                        destination,
                        sequence=sequence,
                        activity=sample.activity,
                        label=sample.label,
                        signer=sample.signer,
                        source=sample.path.name,
                        hand_coverage=np.float32(coverage),
                    )
                manifest.append({
                    "sample_id": sample.sample_id,
                    "feature": str(destination.relative_to(args.output)).replace("\\", "/"),
                    "hand_coverage": round(coverage, 4),
                })
                if coverage < 0.6:
                    print(f"  aviso: mãos detectadas em somente {coverage:.0%} do vídeo")
            except Exception as error:
                failures += 1
                print(f"  ERRO: {error}")

    args.output.mkdir(parents=True, exist_ok=True)
    (args.output / "manifest.json").write_text(
        json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print(f"Concluído: {len(manifest)} extraídos; {failures} falhas.")
    return 1 if failures else 0


if __name__ == "__main__":
    raise SystemExit(main())
