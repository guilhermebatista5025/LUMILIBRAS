import { useEffect, useRef } from "react";
import { Activity, Ambulance, ArrowLeft, Bandage, BookOpen, BriefcaseBusiness, Bus, CalendarDays, CheckCircle2, ChevronRight, ClipboardList, Crown, Cross, Dumbbell, GraduationCap, Hand, Hash, Hospital, IdCard, Languages, LockKeyhole, MapPin, MessageCircle, Palette, Pill, Scissors, ShoppingBasket, Smile, Stethoscope, Syringe, Thermometer, Trophy, UsersRound } from "lucide-react";
import { Mascote } from "../components/mascote/index.js";
import { faseConcluida, obterFases, unidadeLiberada } from "../data/aprendizado.js";
import "./TrilhaCurso.css";

const ICONES = { saude: Cross, hospital: Hospital, ambulancia: Ambulance, profissionais: UsersRound, exames: ClipboardList, vacina: Syringe, termometro: Thermometer, receita: Pill, cirurgia: Scissors, reabilitacao: Dumbbell, curativo: Bandage, convenio: IdCard, local: MapPin, mao: Hand, alfabeto: Languages, conversa: MessageCircle, numeros: Hash, cores: Palette, calendario: CalendarDays, expressao: Smile, atividade: Activity, compras: ShoppingBasket, escola: GraduationCap, transporte: Bus, livro: BookOpen, coroa: Crown, trabalho: BriefcaseBusiness, trofeu: Trophy };

export function TrilhaCurso({ curso, concluidas = [], aprendizado, aoAbrirUnidade, aoVoltar }) {
  const tituloRef = useRef(null);
  const primeiraPendente = curso.unidades.find(u => !concluidas.includes(u.id));
  const totalSinais = curso.unidades.reduce((total, u) => total + (u.sinais || 0), 0);
  const IconeCurso = ICONES[curso.icone];

  useEffect(() => {
    tituloRef.current?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [curso.id]);

  return (
    <div className={`trilha-tela trilha-tema--${curso.tema}`}>
      <button type="button" className="trilha-voltar" onClick={aoVoltar}><ArrowLeft aria-hidden="true" /> Categorias</button>
      <section className="trilha-banner" aria-labelledby="trilha-titulo">
        <span className="trilha-banner-icone"><IconeCurso aria-hidden="true" /></span>
        <div className="trilha-banner-texto">
          <span className="trilha-etiqueta">{curso.etiqueta}</span>
          <h1 id="trilha-titulo" ref={tituloRef} tabIndex={-1}>{curso.titulo}</h1>
          <p>{curso.unidades.length} unidades • {totalSinais ? `${totalSinais} sinais` : curso.nivel || "História e cultura"}</p>
        </div>
        <Mascote pose="joia" tamanho="full" decorativo prioridade className="trilha-mascote" />
      </section>
      <section className="trilha-unidades" aria-labelledby="trilha-unidades-titulo">
        <div className="trilha-secao-titulo">
          <div><p>Trilha de aprendizagem</p><h2 id="trilha-unidades-titulo">Todas as unidades</h2></div>
          <span className="trilha-contagem"><strong>{concluidas.length}/{curso.unidades.length}</strong> concluídas</span>
        </div>
        {curso.emPreparacao && <p className="trilha-preparacao">Conheça os módulos. As aulas desta categoria estão em preparação.</p>}
        <ol className="trilha-lista">
          {curso.unidades.map(unidade => {
            const concluida = concluidas.includes(unidade.id);
            const bloqueada = !unidadeLiberada(aprendizado, curso.id, unidade.id);
            const estudados = obterFases(curso.id, unidade.id).filter(fase => fase.tipo === "estudo" && faseConcluida(aprendizado, curso.id, unidade.id, fase.id)).reduce((total, fase) => total + fase.questoes.length, 0);
            const IconeUnidade = ICONES[unidade.icone] || Stethoscope;
            return <li key={unidade.id}>
              <button type="button" disabled={bloqueada} className={`trilha-unidade ${concluida ? "trilha-unidade--concluida" : ""}`} onClick={() => aoAbrirUnidade(unidade.id)} aria-label={`Unidade ${unidade.id}: ${unidade.titulo}. ${concluida ? "Concluída" : bloqueada ? "Conclua a unidade anterior" : curso.emPreparacao ? "Conhecer módulo" : "Começar unidade"}`}>
                <span className="trilha-unidade-icone"><IconeUnidade aria-hidden="true" /></span>
                <span className="trilha-unidade-conteudo">
                  <span className="trilha-unidade-numero">Unidade {unidade.id}</span>
                  <span className="trilha-unidade-titulo">{unidade.titulo}</span>
                  <span className="trilha-unidade-status">{concluida ? "Concluída" : bloqueada ? "Conclua a unidade anterior" : curso.emPreparacao ? "Conhecer módulo • Em breve" : `${estudados}/${unidade.sinais} ${unidade.sinais === 1 ? "sinal estudado" : "sinais estudados"}`}</span>
                  {!curso.emPreparacao && !bloqueada && <span className="trilha-barra" role="progressbar" aria-label={`Sinais estudados da unidade ${unidade.id}`} aria-valuemin={0} aria-valuemax={unidade.sinais} aria-valuenow={estudados}><span style={{ width: `${estudados / unidade.sinais * 100}%` }} /></span>}
                </span>
                <span className={`trilha-unidade-acao ${bloqueada ? "trilha-unidade-cadeado" : ""}`}>{concluida ? <CheckCircle2 aria-hidden="true" /> : bloqueada ? <LockKeyhole aria-hidden="true" /> : <ChevronRight aria-hidden="true" />}</span>
              </button>
            </li>;
          })}
        </ol>
      </section>
      <aside className="trilha-incentivo">
        <span className="trilha-trofeu"><Trophy aria-hidden="true" /></span>
        <div><h2>{concluidas.length === curso.unidades.length ? "Trilha concluída!" : "Continue aprendendo!"}</h2><p>{curso.incentivo}</p></div>
        <button type="button" onClick={() => aoAbrirUnidade((primeiraPendente || curso.unidades[0]).id)}>{curso.emPreparacao ? "Explorar módulos" : primeiraPendente ? "Continuar aprendendo" : "Revisar unidades"}<ChevronRight aria-hidden="true" /></button>
      </aside>
    </div>
  );
}
