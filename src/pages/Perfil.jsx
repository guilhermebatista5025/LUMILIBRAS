import { useEffect, useState } from "react";
import { Award, Bell, BookOpen, ChevronRight, Flame, Gem, Heart, Pencil, Settings, Shield, Star, UserRound, ArrowLeft, Moon, Volume2, LogOut } from "lucide-react";
import { LogoLumiLibras } from "../components/LogoLumiLibras.jsx";
import { Mascote } from "../components/mascote/index.js";
import trofeu from "../assets/componentes/reaproveitamento-de-elementos/trofeu.png";
import "./Perfil.css";
import { CURSOS } from "../data/cursos.js";
import { obterFases } from "../data/aprendizado.js";
import { authApi } from "../services/authApi.js";
import { FotoPerfilControle } from '../components/FotoPerfilControle.jsx';



function IndicadoresPerfil({ estatisticas, pronto }) {
  return <div className="perfil-indicadores" aria-label="Indicadores do usuário"><span><Flame />{pronto ? estatisticas.sequencia : "—"}</span><span><Gem />{pronto ? estatisticas.diamantes : "—"}</span><span><Heart />{pronto ? estatisticas.coracoes : "—"}</span></div>;
}

function ConfiguracoesPerfil({ nome, aoVoltar }) {
  const [ligados, setLigados] = useState([true, true, true, true]);
  const [contaAberta, setContaAberta] = useState(false);
  const [confirmarSaida, setConfirmarSaida] = useState(false);
  const alternar = (indice) => setLigados((estado) => estado.map((valor, item) => item === indice ? !valor : valor));
  async function sair() { try { await authApi.sair(); } finally { window.location.reload(); } }
  const opcoes = [[Bell, "Notificações", "Receba lembretes para praticar"], [Moon, "Aparência", "Tema claro do LumiLibras"], [Volume2, "Sons e vibração", "Efeitos sonoros das atividades"], [Shield, "Privacidade e segurança", "Controle seus dados e acesso"]];
  return <div className="perfil-configuracoes home-aba-conteudo">
    <header className="perfil-config-cabecalho"><button type="button" onClick={aoVoltar} aria-label="Voltar ao perfil"><ArrowLeft /></button><h1>Configurações</h1><span /></header>
    <p className="perfil-config-intro">Personalize sua experiência no LumiLibras.</p>
    <section className="perfil-config-grupo" aria-label="Preferências"><h2>Preferências</h2>{opcoes.map(([Icone, titulo, subtitulo], indice) => <button type="button" key={titulo} onClick={() => alternar(indice)}><span className="perfil-config-icone"><Icone /></span><div><strong>{titulo}</strong><small>{subtitulo}</small></div><span className={"perfil-config-chave " + (ligados[indice] ? "ligado" : "")} aria-label={ligados[indice] ? "Ativado" : "Desativado"} /></button>)}</section>
    <section className="perfil-config-grupo"><h2>Conta</h2><button type="button" onClick={() => setContaAberta(true)}><span className="perfil-config-icone perfil-config-icone-roxo"><UserRound /></span><div><strong>Dados da conta</strong><small>Nome, e-mail e informações pessoais</small></div><ChevronRight /></button><button type="button" onClick={() => setConfirmarSaida(true)}><span className="perfil-config-icone perfil-config-icone-vermelho"><LogOut /></span><div><strong>Sair da conta</strong><small>Encerrar esta sessão</small></div><ChevronRight /></button></section>
    {contaAberta ? <div className="perfil-config-modal" role="dialog" aria-modal="true"><div><h2>Dados da conta</h2><p>Nome exibido no perfil</p><strong>{nome || "Estudante"}</strong><p>Conta protegida pelo LumiLibras</p><button type="button" onClick={() => setContaAberta(false)}>Fechar</button></div></div> : null}
    {confirmarSaida ? <div className="perfil-config-modal" role="dialog" aria-modal="true"><div><h2>Sair da conta?</h2><p>Você poderá entrar novamente quando quiser.</p><button type="button" onClick={() => setConfirmarSaida(false)}>Cancelar</button><button type="button" className="perfil-config-sair" onClick={sair}>Sair</button></div></div> : null}
  </div>;
}

function EditarPerfil({ nome, fotoUrl, aoFotoSalva, aoVoltar, aoEditarOnboarding }) {
  const [formulario, setFormulario] = useState({ nome: nome || "", usuario: "", cargo: "Estudante de Libras", frase: "Comunicação transforma vidas!" });
  const [animacoes, setAnimacoes] = useState(true);
  const [salvo, setSalvo] = useState(false);
  const alterar = (campo, valor) => setFormulario((estado) => ({ ...estado, [campo]: valor }));
  return <div className="perfil-edicao home-aba-conteudo">
    <header className="perfil-config-cabecalho"><button type="button" onClick={aoVoltar} aria-label="Voltar ao perfil"><ArrowLeft /></button><h1>Editar perfil</h1><span /></header>
    <section className="perfil-edicao-avatar"><FotoPerfilControle fotoUrl={fotoUrl} aoFotoSalva={aoFotoSalva} /><p>Toque na câmera para alterar sua foto</p></section>
    <form onSubmit={(evento) => { evento.preventDefault(); setSalvo(true); }} className="perfil-edicao-form">
      {[["nome", "Nome", "Como você quer ser chamado?"], ["usuario", "Nome de usuário", "Seu @ no LumiLibras"], ["cargo", "Cargo", "Ex.: Estudante de Libras"], ["frase", "Frase do perfil", "Uma frase que representa você"]].map(([campo, rotulo, placeholder]) => <label key={campo}>{rotulo}<input value={formulario[campo]} placeholder={placeholder} onChange={(evento) => alterar(campo, evento.target.value)} /></label>)}
      <button type="button" className="perfil-edicao-opcao" onClick={() => setAnimacoes((estado) => !estado)}><span><SparklesIcon /></span><div><strong>Animações da interface</strong><small>Ativar movimentos e transições do perfil</small></div><i className={"perfil-config-chave " + (animacoes ? "ligado" : "")} /></button>
      <button type="button" className="perfil-edicao-onboarding" onClick={aoEditarOnboarding}><Settings /> Editar preferências do onboarding <ChevronRight /></button>
      <button type="submit" className="perfil-edicao-salvar">Salvar alterações</button>
      {salvo ? <p className="perfil-edicao-sucesso" role="status">Alterações salvas neste dispositivo.</p> : null}
    </form>
  </div>;
}

function SparklesIcon() { return <span aria-hidden="true">✦</span>; }

export function Perfil({ nome, fotoUrl, aoFotoSalva, game, aoConquistas, aoRanking, aoEditarOnboarding }) {
  const [mensagem, setMensagem] = useState("");
  const [configuracoes, setConfiguracoes] = useState(false);
  const [editarAberto, setEditarAberto] = useState(false);
  const primeiroNome = nome?.trim().split(/\s+/)[0] || "Estudante";
  const estatisticas = game.estatisticas;
  const conquistas = game.conquistas.filter(c => c.desbloqueada);
  const totalFases = CURSOS.saude.unidades.reduce((n, u) => n + obterFases("saude", u.id).length, 0);
  const percentual = Math.round(estatisticas.fasesConcluidas / totalFases * 100);
  const avisar = (texto) => {
    if (texto.toLowerCase().startsWith("configura")) {
      setConfiguracoes(true);
      return;
    }
    if (texto.toLowerCase().startsWith("edi")) {
      setEditarAberto(true);
      return;
    }
    setMensagem(texto);
  };
  useEffect(() => {
    const area = document.querySelector(".perfil-conquistas-lista");
    if (!area) return undefined;
    let pegando = false;
    let ultimoX = 0;
    let velocidade = 0;
    let quadro = 0;
    const limitar = (valor) => Math.max(0, Math.min(valor, area.scrollWidth - area.clientWidth));
    const iniciar = (evento) => { pegando = true; velocidade = 0; ultimoX = evento.clientX; area.classList.add("pegando"); area.setPointerCapture?.(evento.pointerId); };
    const mover = (evento) => { if (!pegando) return; velocidade = evento.clientX - ultimoX; ultimoX = evento.clientX; area.scrollLeft = limitar(area.scrollLeft - velocidade); };
    const soltar = () => { pegando = false; area.classList.remove("pegando"); };
    const animar = () => { if (!pegando && Math.abs(velocidade) > 0.1) { velocidade *= .93; area.scrollLeft = limitar(area.scrollLeft - velocidade); } quadro = requestAnimationFrame(animar); };
    area.addEventListener("pointerdown", iniciar); area.addEventListener("pointermove", mover); area.addEventListener("pointerup", soltar); area.addEventListener("pointercancel", soltar); quadro = requestAnimationFrame(animar);
    return () => { cancelAnimationFrame(quadro); area.removeEventListener("pointerdown", iniciar); area.removeEventListener("pointermove", mover); area.removeEventListener("pointerup", soltar); area.removeEventListener("pointercancel", soltar); };
  }, []);
  if (configuracoes) return <ConfiguracoesPerfil nome={nome} aoVoltar={() => setConfiguracoes(false)} />;
  if (editarAberto) return <EditarPerfil nome={nome} fotoUrl={fotoUrl} aoFotoSalva={aoFotoSalva} aoVoltar={() => setEditarAberto(false)} aoEditarOnboarding={aoEditarOnboarding} />;
  return <div className="perfil-tela home-aba-conteudo">
    <header className="perfil-cabecalho"><div className="perfil-marca-linha"><LogoLumiLibras tamanho="sm" className="perfil-logo" /><IndicadoresPerfil estatisticas={estatisticas} pronto={game.versao >= 0} /></div><div className="perfil-titulo-linha"><h1>Perfil</h1><button type="button" onClick={() => avisar("Configurações estarão disponíveis em breve.")} aria-label="Abrir configurações"><Settings /></button></div></header>
    <section className="perfil-card" aria-labelledby="perfil-nome"><FotoPerfilControle fotoUrl={fotoUrl} aoFotoSalva={aoFotoSalva} /><div className="perfil-identidade"><h2 id="perfil-nome">{primeiroNome}</h2><p className="perfil-usuario">@{primeiroNome.toLowerCase()}</p><span className="perfil-cargo"><BookOpen /> Estudante de Libras</span><p className="perfil-frase">“Comunicação transforma vidas!” <Heart fill="currentColor" /></p></div><div className="perfil-mascote"><Mascote pose="boas_vindas" tamanho="full" decorativo /></div><button type="button" className="perfil-editar" onClick={() => avisar("Edição de perfil estará disponível em breve.")}><Pencil /> Editar perfil</button></section>
    <section className="perfil-estatisticas" aria-label="Resumo do perfil"><div><Flame /><strong>{estatisticas.sequencia}</strong><span>Dias seguidos</span></div><div><Gem /><strong>{estatisticas.diamantes}</strong><span>Diamantes</span></div><div><b className="perfil-nivel-icone">▮▮▮</b><strong>Nível {estatisticas.nivel}</strong><span>{estatisticas.xp} / {estatisticas.nivel * 100} XP</span></div><div><Award /><strong>{estatisticas.diasLogados}</strong><span>Dias de acesso</span></div></section>
    <section className="perfil-ranking-banner" aria-labelledby="perfil-ranking-titulo"><div className="perfil-ranking-copy"><span className="perfil-ranking-label"><b>♛</b> Sua posição no ranking</span><strong id="perfil-ranking-titulo">{game.posicao ? `#${game.posicao}` : "—"}</strong><p>{game.posicao ? `Entre ${game.participantes} estudantes` : "Conclua uma fase para entrar no ranking"}</p><button type="button" onClick={aoRanking}>Ver ranking <ChevronRight /></button></div><img src={trofeu} alt="" draggable="false" /></section>
    <section className="perfil-conquistas" aria-labelledby="perfil-conquistas-titulo"><div className="perfil-secao-titulo"><h2 id="perfil-conquistas-titulo"><Star fill="currentColor" /> Minhas Conquistas</h2><button type="button" onClick={aoConquistas}>Ver todas <ChevronRight /></button></div><div className="perfil-conquistas-lista">{conquistas.length ? conquistas.map(c => <article className="perfil-conquista" key={c.id}><span className="perfil-medalha perfil-medalha-verde">★</span><strong>{c.nome}</strong><span>Concluída</span></article>) : <p>Você ainda não desbloqueou conquistas.</p>}</div></section>
    <section className="perfil-progresso" aria-labelledby="perfil-progresso-titulo"><div className="perfil-secao-titulo"><h2 id="perfil-progresso-titulo"><b className="perfil-progresso-icone">▮▮▮</b> Meu Progresso</h2><button type="button" onClick={() => avisar("Detalhes do progresso estarão disponíveis em breve.")}>Ver detalhes <ChevronRight /></button></div><div className="perfil-progresso-card"><div className="perfil-circulo" style={{ "--perfil-progresso": percentual }}><strong>{percentual}%</strong></div><div><h3>Progresso geral</h3><p>Você já completou {estatisticas.fasesConcluidas} de {totalFases} fases de saúde</p><span className="perfil-barra"><i style={{ "--progresso-real": `${percentual}%` }} /></span></div></div></section>
    <section className="perfil-links" aria-label="Atalhos do perfil">{[[UserRound, "Minhas Estatísticas", "Veja seu desempenho completo"], [BookOpen, "Conteúdos Salvos", "Suas lições e conteúdos favoritos"], [Settings, "Configurações", "Personalize sua experiência"]].map(([Icone, titulo, subtitulo]) => <button type="button" key={titulo} onClick={() => avisar(`${titulo} estará disponível em breve.`)}><span><Icone /></span><div><strong>{titulo}</strong><small>{subtitulo}</small></div><ChevronRight /></button>)}</section>
    {mensagem ? <div className="perfil-aviso" role="status">{mensagem}<button type="button" onClick={() => setMensagem("")} aria-label="Fechar aviso">×</button></div> : null}
  </div>;
}
