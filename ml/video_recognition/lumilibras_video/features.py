from __future__ import annotations

import numpy as np

TARGET_FRAMES = 48
POSE_POINTS = 33
HAND_POINTS = 21
POINT_COUNT = POSE_POINTS + HAND_POINTS * 2


def resample_sequence(sequence: np.ndarray, frames: int = TARGET_FRAMES) -> np.ndarray:
    if sequence.ndim != 3 or sequence.shape[1:] != (POINT_COUNT, 4):
        raise ValueError(f"Sequência esperada: [tempo, {POINT_COUNT}, 4]")
    if len(sequence) == 0:
        raise ValueError("Não é possível reamostrar uma sequência vazia")
    if len(sequence) == frames:
        return sequence.astype(np.float32, copy=True)

    old_axis = np.linspace(0.0, 1.0, len(sequence))
    new_axis = np.linspace(0.0, 1.0, frames)
    result = np.empty((frames, POINT_COUNT, 4), dtype=np.float32)
    for point in range(POINT_COUNT):
        for value in range(4):
            result[:, point, value] = np.interp(
                new_axis, old_axis, sequence[:, point, value]
            )
    result[:, :, 3] = (result[:, :, 3] >= 0.5).astype(np.float32)
    return result


def normalize_sequence(sequence: np.ndarray) -> np.ndarray:
    """Centraliza nos ombros e usa a largura dos ombros como escala."""
    output = sequence.astype(np.float32, copy=True)
    present = output[:, :, 3:4]
    left_shoulder = output[:, 11, :3]
    right_shoulder = output[:, 12, :3]
    center = (left_shoulder + right_shoulder) / 2.0
    scale = np.linalg.norm(left_shoulder[:, :2] - right_shoulder[:, :2], axis=1)
    valid_scale = scale[scale > 1e-4]
    fallback = float(np.median(valid_scale)) if len(valid_scale) else 1.0
    scale = np.where(scale > 1e-4, scale, fallback).reshape(-1, 1, 1)
    output[:, :, :3] = ((output[:, :, :3] - center[:, None, :]) / scale) * present
    return output


def sequence_to_image(sequence: np.ndarray) -> np.ndarray:
    """Gera uma imagem temporal RGB: X, Y e magnitude do movimento."""
    sequence = normalize_sequence(resample_sequence(sequence))
    coordinates = sequence[:, :, :3]
    present = sequence[:, :, 3]
    motion = np.linalg.norm(
        np.diff(coordinates[:, :, :2], axis=0, prepend=coordinates[:1, :, :2]),
        axis=2,
    )
    x = np.clip((coordinates[:, :, 0] + 3.0) / 6.0, 0.0, 1.0)
    y = np.clip((coordinates[:, :, 1] + 3.0) / 6.0, 0.0, 1.0)
    speed = np.clip(motion / 0.35, 0.0, 1.0)
    image = np.stack((x.T, y.T, speed.T), axis=0)
    image *= present.T[None, :, :]
    return image.astype(np.float32)
