/* MediaPipe 1.0.1, worker clássico: mantém a inferência fora da interface. */
let detector;
self.onmessage = async ({ data }) => {
  if (data.type === 'init') {
    try {
      self.postMessage({ type: 'loading', step: 'wasm' });
      importScripts('./runtime/vision_bundle.js');
      const files = await Vision.FilesetResolver.forVisionTasks(new URL('./runtime/wasm', self.location.href).href);
      self.postMessage({ type: 'loading', step: 'model' });
      detector = await Vision.HandLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: new URL('./runtime/hand_landmarker.task', self.location.href).href, delegate: 'CPU' },
        // A tela de teste envia quadros assim que o detector fica pronto. Começar
        // em VIDEO evita chamar detectForVideo enquanto a tarefa ainda está em IMAGE.
        runningMode: 'VIDEO', numHands: 2,
        minHandDetectionConfidence: 0.65, minHandPresenceConfidence: 0.65, minTrackingConfidence: 0.6,
      });
      self.postMessage({ type: 'ready' });
    } catch (error) {
      self.postMessage({ type: 'error', message: `Não foi possível carregar o rastreador: ${error?.message || 'erro desconhecido'}` });
    }
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
    } catch {
      try {
        await detector?.setOptions({ runningMode: 'VIDEO' });
        self.postMessage({ type: 'reference-unavailable' });
      } catch {
        self.postMessage({ type: 'error', message: 'Não foi possível iniciar o rastreamento das mãos neste dispositivo.' });
      }
    }
    finally { data.frames.forEach(frame => frame.close()); }
    return;
  }
  if (data.type === 'frame') {
    try {
      if (!detector) throw new Error('Rastreador não iniciado.');
      const result = detector.detectForVideo(data.frame, data.timestamp);
      self.postMessage({ type: 'result', landmarks: result.landmarks, worldLandmarks: result.worldLandmarks, handedness: result.handedness });
    } catch { self.postMessage({ type: 'frame-error' }); }
    finally { data.frame.close(); }
  }
};
