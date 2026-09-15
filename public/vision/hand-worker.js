/* MediaPipe 1.0.1, worker clássico: mantém a inferência fora da interface. */
let detector;
self.onmessage = async ({ data }) => {
  if (data.type === 'init') {
    try {
      importScripts('./runtime/vision_bundle.js');
      const files = await Vision.FilesetResolver.forVisionTasks(new URL('./runtime/wasm', self.location.href).href);
      detector = await Vision.HandLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: new URL('./runtime/hand_landmarker.task', self.location.href).href, delegate: 'CPU' },
        runningMode: 'IMAGE', numHands: 2,
        minHandDetectionConfidence: 0.65, minHandPresenceConfidence: 0.65, minTrackingConfidence: 0.6,
      });
      self.postMessage({ type: 'ready' });
    } catch { self.postMessage({ type: 'error', message: 'Não foi possível carregar o rastreador. Tente novamente ou continue sem câmera.' }); }
    return;
  }
  if (data.type === 'reference') {
    try {
      if (!detector) throw new Error('Rastreador não iniciado.');
      await detector.setOptions({ runningMode: 'IMAGE' });
      const frames = data.frames.map(frame => {
        const result = detector.detect(frame);
        return { landmarks: result.landmarks, worldLandmarks: result.worldLandmarks,
          width: frame.width, height: frame.height };
      });
      await detector.setOptions({ runningMode: 'VIDEO' });
      self.postMessage({ type: 'reference', frames });
    } catch { self.postMessage({ type: 'error', message: 'Não foi possível preparar a orientação deste sinal. Tente abrir a prática novamente.' }); }
    finally { data.frames.forEach(frame => frame.close()); }
    return;
  }
  if (data.type === 'frame') {
    try {
      if (!detector) throw new Error('Rastreador não iniciado.');
      const result = detector.detectForVideo(data.frame, data.timestamp);
      self.postMessage({ type: 'result', landmarks: result.landmarks, worldLandmarks: result.worldLandmarks, handedness: result.handedness });
    } catch { self.postMessage({ type: 'error', message: 'O rastreamento foi interrompido. Desligamos a câmera; você pode tentar novamente.' }); }
    finally { data.frame.close(); }
  }
};
