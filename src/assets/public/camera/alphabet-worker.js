/* Localiza a mão com MediaPipe; a classificação da letra acontece no navegador. */
let detector;

self.onmessage = async ({ data }) => {
  if (data.type === "init") {
    try {
      importScripts("./runtime/vision_bundle.js");
      const files = await Vision.FilesetResolver.forVisionTasks(new URL("./runtime/wasm", self.location.href).href);
      detector = await Vision.HandLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: new URL("./runtime/hand_landmarker.task", self.location.href).href, delegate: "CPU" },
        runningMode: "VIDEO",
        numHands: 1,
        minHandDetectionConfidence: 0.6,
        minHandPresenceConfidence: 0.6,
        minTrackingConfidence: 0.55,
      });
      self.postMessage({ type: "ready" });
    } catch (error) {
      self.postMessage({ type: "fatal", message: error?.message || "Detector indisponível." });
    }
    return;
  }

  if (data.type !== "frame") return;
  try {
    if (!detector) throw new Error("Detector ainda não iniciado.");
    const result = detector.detectForVideo(data.frame, data.timestamp);
    const pontos = result.landmarks?.[0];
    if (!pontos?.length) {
      self.postMessage({ type: "result", requestId: data.requestId, timestamp: data.timestamp, box: null, landmarks: null });
      return;
    }
    const xs = pontos.map(ponto => ponto.x);
    const ys = pontos.map(ponto => ponto.y);
    const margemX = 50 / data.frame.width;
    const margemY = 50 / data.frame.height;
    self.postMessage({
      type: "result",
      requestId: data.requestId,
      timestamp: data.timestamp,
      // Coordenadas normalizadas do MediaPipe (0..1); não contém foto ou vídeo.
      landmarks: pontos.map(({ x, y, z }) => ({ x, y, z })),
      box: {
        x: Math.max(0, Math.min(...xs) - margemX),
        y: Math.max(0, Math.min(...ys) - margemY),
        largura: Math.min(1, Math.max(...xs) + margemX) - Math.max(0, Math.min(...xs) - margemX),
        altura: Math.min(1, Math.max(...ys) + margemY) - Math.max(0, Math.min(...ys) - margemY),
      },
    });
  } catch {
    self.postMessage({ type: "result", requestId: data.requestId, timestamp: data.timestamp, box: null, landmarks: null });
  } finally {
    data.frame.close();
  }
};

