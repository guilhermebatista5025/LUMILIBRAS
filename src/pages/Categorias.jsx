import { useEffect, useRef } from "react";
import { ArrowLeft, BookOpen, ChevronRight, Clock3, Cross, Crown, Hand, Play, Star, UsersRound } from "lucide-react";
import interprete1 from "../assets/categorias/imagem-1.webp";
import interprete2 from "../assets/categorias/imagem-2.webp";
import interprete3 from "../assets/categorias/imagem-3.webp";
import interprete4 from "../assets/categorias/imagem-4.webp";
import interpreteSaude from "../assets/categorias/imagem-5.webp";
import interpreteBasico from "../assets/categorias/imagem-6.webp";
import interpreteIntermediario from "../assets/categorias/imagem-7.webp";
import interpreteAvancado from "../assets/categorias/imagem-8.webp";
import "./Categorias.css";

const HISTORIA = {
  id: "historia", titulo: "A história da Libras no Brasil", paginas: 20,
  descricao: "Conheça a trajetória da Língua Brasileira de Sinais, sua luta, conquistas e marcos importantes.",
};

const CURSOS = [
  { id: "saude", titulo: "Libras no contexto da saúde", linhas: ["Libras no", "contexto da saúde"], descricao: "Comunicação acessível para profissionais e pacientes.", nivel: "Essencial", paginas: 40, Icone: Cross, imagem: interpreteSaude, gratuito: true },
  { id: "basico", titulo: "Libras Básico para iniciantes", linhas: ["Libras Básico", "para iniciantes"], descricao: "Primeiros passos para se comunicar em Libras.", nivel: "Iniciante", paginas: 40, Icone: Hand, imagem: interpreteBasico },
  { id: "intermediario", titulo: "Libras Intermediário", linhas: ["Libras", "Intermediário"], descricao: "Amplie seu vocabulário e conquiste fluência nas conversas do dia a dia.", nivel: "Intermediário", paginas: 40, Icone: UsersRound, imagem: interpreteIntermediario },
  { id: "avancado", titulo: "Libras Avançado", linhas: ["Libras", "Avançado"], descricao: "Domine estruturas complexas e aprofunde sua comunicação em diversos contextos.", nivel: "Avançado", paginas: 40, Icone: Crown, imagem: interpreteAvancado },
];

function Paginas({ quantidade }) {
  return <span className="categoria-paginas"><strong>{quantidade}</strong><span>páginas</span></span>;
}

function InformacoesCurso({ curso }) {
  return (
    <span className="categoria-informacoes">
      <span><Clock3 aria-hidden="true" />20h</span>
      <span><BookOpen aria-hidden="true" />{curso.paginas} páginas</span>
      {curso.nivel ? <span className="categoria-nivel">Nível: <strong>{curso.nivel}</strong></span> : null}
    </span>
  );
}

export function Categorias({ aoVoltar, aoAbrirCurso }) {
  const tituloRef = useRef(null);

  useEffect(() => { tituloRef.current?.focus({ preventScroll: true }); }, []);

  return (
    <div className="categorias-tela home-aba-conteudo">
      <div className="categorias-titulo">
        <button type="button" onClick={aoVoltar} aria-label="Voltar para a home"><ArrowLeft aria-hidden="true" /></button>
        <h1 ref={tituloRef} tabIndex={-1}>Categorias</h1>
        <span>Explore os cursos</span>
      </div>

      <section aria-label="Cursos de Libras" className="categorias-lista">
        <button type="button" className="categoria-card categoria-card--historia" onClick={() => aoAbrirCurso(HISTORIA.id)} aria-label={`Conhecer o curso: ${HISTORIA.titulo}`}>
          <span className="categoria-historia-cenario" aria-hidden="true">
            <span className="categoria-historia-marco categoria-historia-marco--um">1857<small>Educação de surdos</small></span>
            <span className="categoria-historia-marco categoria-historia-marco--dois">Libras<small>História e conquistas</small></span>
          </span>
          <span className="categoria-grupo" aria-hidden="true">
            {[interprete1, interprete2, interprete3, interprete4].map((imagem, indice) => <img key={imagem} src={imagem} alt="" className={`categoria-grupo-pessoa categoria-grupo-pessoa--${indice + 1}`} decoding="async" />)}
          </span>
          <span className="categoria-conteudo">
            <span className="categoria-destaque"><Star aria-hidden="true" />Curso de destaque</span>
            <h2>{HISTORIA.titulo}</h2>
            <span className="categoria-descricao">{HISTORIA.descricao}</span>
            <InformacoesCurso curso={HISTORIA} />
            <span className="categoria-continuar">Continuar <Play aria-hidden="true" /></span>
          </span>
          <Paginas quantidade={HISTORIA.paginas} />
        </button>

        {CURSOS.map(curso => (
          <button key={curso.id} type="button" className={`categoria-card categoria-card--${curso.id}`} onClick={() => aoAbrirCurso(curso.id)} aria-label={`Abrir curso: ${curso.titulo}`}>
            <span className="categoria-retrato" aria-hidden="true"><img src={curso.imagem} alt="" decoding="async" loading="lazy" /></span>
            <span className="categoria-conteudo">
              <span className="categoria-cabecalho">
                <span className="categoria-icone"><curso.Icone aria-hidden="true" /></span>
                <h2>{curso.linhas.map(linha => <span key={linha}>{linha}</span>)}</h2>
              </span>
              <span className="categoria-descricao">{curso.descricao}</span>
              {curso.gratuito ? <span className="categoria-gratuito">Gratuito</span> : null}
            </span>
            <InformacoesCurso curso={curso} />
            <Paginas quantidade={curso.paginas} />
            <span className="categoria-seta"><ChevronRight aria-hidden="true" /></span>
          </button>
        ))}
      </section>

    </div>
  );
}
