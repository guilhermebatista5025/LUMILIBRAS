export const SKIN_CLASSICA = 'classica';

export function skinAtiva() {
  return typeof document === 'undefined' ? SKIN_CLASSICA : document.documentElement.dataset.lumiSkin || SKIN_CLASSICA;
}

export function definirSkinAtiva(id) {
  if (typeof document === 'undefined') return;
  document.documentElement.dataset.lumiSkin = id || SKIN_CLASSICA;
  window.dispatchEvent(new Event('lumi-skin-change'));
}

export function observarSkin(callback) {
  window.addEventListener('lumi-skin-change', callback);
  return () => window.removeEventListener('lumi-skin-change', callback);
}
