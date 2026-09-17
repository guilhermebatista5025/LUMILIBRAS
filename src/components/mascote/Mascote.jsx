import { useSyncExternalStore } from "react";
import { observarSkin, skinAtiva } from "../../lib/lumiSkin.js";
import micoLeao from "../../assets/personagens/skins/mico-leao-dourado.webp";
import historiador from "../../assets/personagens/skins/mico-leao-historiador.webp";
import enfermeiraArara from "../../assets/personagens/skins/enfermeira-arara.webp";
import bombeira from "../../assets/personagens/skins/onça-bombeiro.webp";
import kira from "../../assets/personagens/skins/onça-defaut.webp";
import mila from "../../assets/personagens/skins/capivara-defaut.webp";
import milaPijama from "../../assets/personagens/skins/capivara-com-soninho.webp";
import assustado from "../../assets/personagens/poses/assustado.webp";
import boasVindas from "../../assets/personagens/poses/boas_vindas.webp";
import brava from "../../assets/personagens/poses/brava.webp";
import curiosa from "../../assets/personagens/poses/curiosa.webp";
import joia from "../../assets/personagens/poses/joia.webp";
import otimo from "../../assets/personagens/poses/otimo.webp";
import palmas from "../../assets/personagens/poses/palmas.webp";
import sono from "../../assets/personagens/poses/sono.webp";
import triste from "../../assets/personagens/poses/triste.webp";

const POSES = Object.freeze({
  assustado: {
    src: assustado,
    alt: "Mascote LumiLibras com expressão de susto",
  },
  boas_vindas: {
    src: boasVindas,
    alt: "Mascote LumiLibras acenando em boas-vindas",
  },
  brava: {
    src: brava,
    alt: "Mascote LumiLibras com expressão brava",
  },
  curiosa: {
    src: curiosa,
    alt: "Mascote LumiLibras pensando com curiosidade",
  },
  joia: {
    src: joia,
    alt: "Mascote LumiLibras fazendo sinal de positivo",
  },
  otimo: {
    src: otimo,
    alt: "Mascote LumiLibras celebrando com entusiasmo",
  },
  palmas: {
    src: palmas,
    alt: "Mascote LumiLibras batendo palmas",
  },
  sono: {
    src: sono,
    alt: "Mascote LumiLibras com sono",
  },
  triste: {
    src: triste,
    alt: "Mascote LumiLibras com expressão triste",
  },
});

const TAMANHOS = Object.freeze({
  xs: "size-16",
  sm: "size-24",
  md: "size-36",
  lg: "size-52",
  xl: "size-72",
  full: "h-auto w-full",
});

const PERSONAGENS = Object.freeze({
  kira: { src: kira, alt: 'Kira, a onça-pintada' },
  mila: { src: mila, alt: 'Mila, a capivara' },
  'mila-pijama': { src: milaPijama, alt: 'Mila, a capivara com sono' },
  'mico-leao': { src: micoLeao, alt: 'Nino, o mico-leão-dourado, acenando' },
  historiador: { src: historiador, alt: 'Nino, o mico-leão-dourado historiador' },
  'enfermeira-arara': { src: enfermeiraArara, alt: 'Lumi, a arara enfermeira' },
  bombeira: { src: bombeira, alt: 'Kira, a onça bombeira' },
});

export const POSES_MASCOTE = Object.freeze(Object.keys(POSES));

/**
 * Exibe uma das poses oficiais do mascote.
 *
 * @param {object} props
 * @param {keyof typeof POSES} [props.pose]
 * @param {keyof typeof TAMANHOS} [props.tamanho]
 * @param {string} [props.alt]
 * @param {boolean} [props.decorativo]
 * @param {boolean} [props.prioridade]
 * @param {boolean} [props.animado]
 * @param {string} [props.className]
 */
export function Mascote({
  pose = "boas_vindas",
  tamanho = "md",
  alt,
  decorativo = false,
  prioridade = false,
  animado = false,
  className = "",
  skin,
}) {
  const skinEquipada = useSyncExternalStore(observarSkin, skinAtiva, () => 'classica');
  const poseSelecionada = POSES[pose] ?? POSES.boas_vindas;
  const personagem = PERSONAGENS[skin ?? skinEquipada];
  const classeTamanho = TAMANHOS[tamanho] ?? TAMANHOS.md;
  const textoAlternativo = decorativo ? "" : (alt ?? personagem?.alt ?? poseSelecionada.alt);

  return (
    <img
      src={personagem?.src ?? poseSelecionada.src}
      alt={textoAlternativo}
      aria-hidden={decorativo || undefined}
      width="500"
      height="500"
      loading={prioridade ? "eager" : "lazy"}
      fetchPriority={prioridade ? "high" : "auto"}
      decoding="async"
      draggable="false"
      className={`mascote-skin shrink-0 select-none object-contain ${classeTamanho} ${animado ? "mascote-flutuar" : ""} ${className}`.trim()}
    />
  );
}
