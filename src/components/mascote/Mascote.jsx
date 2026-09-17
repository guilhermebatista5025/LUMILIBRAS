import { useSyncExternalStore } from "react";
import { observarSkin, skinAtiva } from "../../lib/lumiSkin.js";
import micoLeao from "../../assets/mico-leao-default.webp";
import historiador from "../../assets/historiador.webp";
import enfermeiraArara from "../../assets/enfermeira-arara.webp";
import bombeira from "../../assets/bombeira.webp";
import assustado from "../../../mascote/assustado.webp";
import boasVindas from "../../../mascote/boas_vindas.webp";
import brava from "../../../mascote/brava.webp";
import curiosa from "../../../mascote/curiosa.webp";
import joia from "../../../mascote/joia.webp";
import otimo from "../../../mascote/otimo.webp";
import palmas from "../../../mascote/palmas.webp";
import sono from "../../../mascote/sono.webp";
import triste from "../../../mascote/triste.webp";

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
