/* Detector temporal do protótipo: toda inferência fica local no navegador. */
let detector;
let tempo = 0;

self.onmessage = async ({ data }) => {
  if (data.type === "init") {
    try {
      importScripts("./runtime/vision_bundle.js");
      const files = await Vision.FilesetResolver.forVisionTasks(new URL("./runtime/wasm", self.location.href).href);
      detector = await Vision.HandLandmarker.createFromOptions(files, {
        baseOptions: {
          modelAssetPath: new URL("./runtime/hand_landmarker.task", self.location.href).href,
          delegate: "CPU",
        },
        runningMode: "VIDEO",
        numHands: 2,
        minHandDetectionConfidence: 0.5,
        minHandPresenceConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });
      self.postMessage({ type: "ready" });
    } catch (error) {
      self.postMessage({ type: "fatal", message: error?.message || "Falha ao carregar o detector." });
    }
    return;
  }

  if (data.type === "detect") {
    try {
      if (!detector) throw new Error("Detector ainda não está pronto.");
      tempo += 34;
      const result = detector.detectForVideo(data.frame, tempo);
      self.postMessage({
        type: "result",
        requestId: data.requestId,
        landmarks: result.landmarks,
        handedness: result.handedness,
      });
    } catch (error) {
      self.postMessage({ type: "request-error", requestId: data.requestId, message: error?.message || "Falha ao analisar o quadro." });
    } finally {
      data.frame.close();
    }
  }
};
