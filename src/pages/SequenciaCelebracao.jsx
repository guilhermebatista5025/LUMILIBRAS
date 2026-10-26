import { useMemo } from "react";
import { ArrowRight, Check, Share2 } from "lucide-react";
import foguinhoSequencia from "../assets/elementos/foguinho-sequencia.webp";
import { Mascote } from "../components/mascote/index.js";
import "./SequenciaCelebracao.css";

const DIAS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];

export function SequenciaCelebracao({ total, acessos = [], atividades = [], aoContinuar }) {
  const semana = useMemo(() => {
    const dataSaoPaulo = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Sao_Paulo" }).format(new Date());
    const hoje = new Date(`${dataSaoPaulo}T12:00:00`);
    const inicio = new Date(hoje);
    inicio.setDate(inicio.getDate() - ((inicio.getDay() + 6) % 7));
    const visitas = new Set(acessos.map(dia => String(dia).slice(0, 10)));
    const praticas = new Set(atividades.map(dia => String(dia).slice(0, 10)));
    return DIAS.map((nome, indice) => {
      const data = new Date(inicio);
      data.setDate(inicio.getDate() + indice);
      const chave = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}-${String(data.getDate()).padStart(2, "0")}`;
      return { nome, hoje: data.toDateString() === hoje.toDateString(), ativo: visitas.has(chave) && praticas.has(chave) };
    });
  }, [acessos, atividades]);

  async function compartilhar() {
    const texto = `Completei ${total} dias seguidos aprendendo Libras no LumiLibras!`;
    if (navigator.share) {
      try { await navigator.share({ title: "Minha sequência LumiLibras", text: texto }); } catch (erro) { if (erro.name !== "AbortError") console.error("Falha ao compartilhar sequência", erro); }
    } else if (navigator.clipboard?.writeText) await navigator.clipboard.writeText(texto);
  }

  return (
    <section className="sequencia-celebracao" role="dialog" aria-modal="true" aria-labelledby="sequencia-titulo">
      <div className="sequencia-bolha" aria-hidden="true">Você<br />conseguiu!</div>
      <div className="sequencia-hero" aria-hidden="true">
        <span className="sequencia-brilho sequencia-brilho--um">✦</span><span className="sequencia-brilho sequencia-brilho--dois">✦</span>
        <Mascote pose="otimo" tamanho="full" animado prioridade className="sequencia-mascote" />
        <img src={foguinhoSequencia} alt="" className="sequencia-fogo-hero" />
      </div>
      <div className="sequencia-conteudo">
        <p className="sequencia-etiqueta">Missão concluída</p>
        <h1 id="sequencia-titulo"><span>{total}</span><br />dias de sequência</h1>
        <p className="sequencia-descricao">Continue assim! Você está construindo sua constância em Libras.</p>
        <div className="sequencia-calendario" aria-label="Atividade desta semana">
          {semana.map(dia => <div className={`sequencia-dia ${dia.ativo ? "ativo" : ""} ${dia.hoje ? "hoje" : ""}`} key={dia.nome}>
            <span>{dia.nome}</span><span className="sequencia-dia-icone" aria-label={dia.ativo ? "Atividade concluída" : "Sem atividade"}>
              {dia.hoje ? <img src={foguinhoSequencia} alt="" /> : dia.ativo ? <Check aria-hidden="true" strokeWidth={3.5} /> : null}
            </span>
          </div>)}
        </div>
        <button type="button" className="sequencia-continuar" onClick={aoContinuar}>Continuar <ArrowRight aria-hidden="true" /></button>
        <button type="button" className="sequencia-compartilhar" onClick={compartilhar}><span><Share2 aria-hidden="true" /></span>Compartilhar minha sequência</button>
      </div>
    </section>
  );
}
