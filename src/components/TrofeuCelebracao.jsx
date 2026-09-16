import trofeu from "../assets/componentes/reaproveitamento-de-elementos/trofeu.webp";
import "./TrofeuCelebracao.css";

export function TrofeuCelebracao({ className = "" }) {
  return (
    <div className={`trofeu-celebracao ${className}`} aria-hidden="true">
      <img className="trofeu-celebracao-imagem" src={trofeu} alt="" draggable="false" decoding="async" />
      <span className="trofeu-confetes">
        {Array.from({ length: 8 }, (_, indice) => <i key={indice} style={{ "--indice": indice }} />)}
      </span>
    </div>
  );
}
