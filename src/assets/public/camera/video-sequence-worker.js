/* Inferência temporal local: mãos, rosto e pose usando MediaPipe Tasks Vision. */
let handDetector;
let faceDetector;
let poseDetector;
let tempo = 0;

self.onmessage = async ({ data }) => {
  if (data.type === "init") {
    try {
      importScripts("./runtime/vision_bundle.js");
      const files = await Vision.FilesetResolver.forVisionTasks(new URL("./runtime/wasm", self.location.href).href);
      const base = { delegate: "CPU" };
      [handDetector, faceDetector, poseDetector] = await Promise.all([
        Vision.HandLandmarker.createFromOptions(files, {
          baseOptions: { ...base, modelAssetPath: new URL("./runtime/hand_landmarker.task", self.location.href).href },
          runningMode: "VIDEO", numHands: 2,
          minHandDetectionConfidence: 0.5, minHandPresenceConfidence: 0.5, minTrackingConfidence: 0.5,
        }),
        Vision.FaceLandmarker.createFromOptions(files, {
          baseOptions: { ...base, modelAssetPath: new URL("./runtime/face_landmarker.task", self.location.href).href },
          runningMode: "VIDEO", numFaces: 1, outputFaceBlendshapes: true,
          minFaceDetectionConfidence: 0.45, minFacePresenceConfidence: 0.45, minTrackingConfidence: 0.45,
        }),
        Vision.PoseLandmarker.createFromOptions(files, {
          baseOptions: { ...base, modelAssetPath: new URL("./runtime/pose_landmarker_lite.task", self.location.href).href },
          runningMode: "VIDEO", numPoses: 1,
          minPoseDetectionConfidence: 0.45, minPosePresenceConfidence: 0.45, minTrackingConfidence: 0.45,
        }),
      ]);
      self.postMessage({ type: "ready" });
    } catch (error) {
      self.postMessage({ type: "fatal", message: error?.message || "Falha ao carregar os detectores." });
    }
    return;
  }

  if (data.type !== "detect") return;
  try {
    if (!handDetector || !faceDetector || !poseDetector) throw new Error("Detectores ainda não estão prontos.");
    tempo += 34;
    const hands = handDetector.detectForVideo(data.frame, tempo);
    const face = faceDetector.detectForVideo(data.frame, tempo);
    const pose = poseDetector.detectForVideo(data.frame, tempo);
    self.postMessage({
      type: "result", requestId: data.requestId,
      landmarks: hands.landmarks || [], handedness: hands.handedness || [],
      faceLandmarks: face.faceLandmarks || [], faceBlendshapes: face.faceBlendshapes || [],
      poseLandmarks: pose.landmarks || [],
    });
  } catch (error) {
    self.postMessage({ type: "request-error", requestId: data.requestId, message: error?.message || "Falha ao analisar o quadro." });
  } finally {
    data.frame.close();
  }
};
