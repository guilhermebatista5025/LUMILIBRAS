import { ArrowLeft, BookOpen, Check, Clock3, Coins, Compass, Eye, Feather, HeartPulse, LockKeyhole, Moon, Shield, Sparkles, Star } from 'lucide-react';
import { Mascote } from '../components/mascote/index.js';
import { PERSONAGENS, SKINS, personagemPorId, skinPorId } from '../data/companheiros.js';
import diamante from '../assets/elementos/diamante.webp';
import './DetalhesCompanheiro.css';

const iconesPersonagem = { lumi: Compass, nino: BookOpen, kira: Eye, mila: HeartPulse };
const iconesSkin = { 'enfermeira-arara': HeartPulse, historiador: BookOpen, bombeira: Shield, 'mila-pijama': Moon };

function Habilidade({ titulo, habilidade, Icone, destaque }) {
  return <section className={`companheiro-habilidade ${destaque ? 'companheiro-habilidade--destaque' : ''}`}>
    <span className="companheiro-habilidade-icone"><Icone aria-hidden="true" /></span>
    <div><small>{titulo}</small><h3>{habilidade.nome}</h3><p>{habilidade.descricao}</p>
      <span className="companheiro-limite"><Clock3 size={15} aria-hidden="true" /> {habilidade.limite}</span>
    </div>
  </section>;
}

export function DetalhesCompanheiro({ skinId, itens, estado, ocupado, moedas, diamantes, usouHoje, hoje, aoVoltar, aoSelecionar, aoComprar, aoEquipar, aoUsarHabilidade }) {
  const skin = skinPorId(skinId);
  const personagem = personagemPorId(skin?.personagem);
  if (!skin || !personagem) return null;

  const item = itens.find(catalogo => catalogo.tipo === 'skin' && catalogo.id === skinId);
  const possui = skinId === 'classica' || Boolean(estado?.skins?.includes(skinId));
  const equipada = estado?.skinAtiva === skinId;
  const saldo = item?.moeda === 'diamantes' ? diamantes : moedas;
  const podeComprar = item && saldo >= item.preco;
  const skinsDoPersonagem = SKINS.filter(visual => visual.personagem === personagem.id);
  const IconePersonagem = iconesPersonagem[personagem.id] || Star;
  const IconeSkin = iconesSkin[skinId] || Sparkles;

  return <div className={`companheiro-detalhes companheiro-detalhes--${skinId} home-aba-conteudo`}>
    <button className="companheiro-voltar" type="button" onClick={aoVoltar}><ArrowLeft size={19} aria-hidden="true" /> Voltar para a loja</button>
    <header className={`companheiro-hero companheiro-hero--${personagem.id}`}>
      <div className="companheiro-hero-texto"><span className="companheiro-selo"><Star size={14} aria-hidden="true" /> Ficha do companheiro</span>
        <h1>{personagem.nome}</h1><p>{personagem.papel}</p>
        <div className="companheiro-hero-tags"><span><Feather size={15} aria-hidden="true" /> {personagem.especie}</span><span><IconePersonagem size={15} aria-hidden="true" /> {personagem.especialidade}</span></div>
      </div>
      <Mascote skin={skinId} tamanho="full" decorativo prioridade className="companheiro-hero-arte" />
    </header>

    <section className="companheiro-ficha" aria-labelledby="companheiro-visual-titulo">
      <div className="companheiro-ficha-topo"><div><small>VISUAL SELECIONADO</small><h2 id="companheiro-visual-titulo">{skin.nome}</h2></div>
        <span className={`companheiro-estado ${equipada ? 'companheiro-estado--ativo' : ''}`}>{equipada ? 'Equipado' : possui ? 'Na coleção' : item ? 'Na loja' : 'Em breve'}</span></div>
      <p>{skin.cosmetica ? 'Um visual para acompanhar suas conquistas. A habilidade do personagem continua com ele.' : 'Este visual traz uma habilidade especial além da habilidade do personagem.'}</p>
      {item && !possui && <div className="companheiro-preco"><span>Para desbloquear</span><strong>{item.moeda === 'diamantes' ? <img src={diamante} alt="" /> : <Coins size={19} aria-hidden="true" />}{item.preco} {item.moeda}</strong></div>}
      {item && !possui && <button className="companheiro-acao" type="button" disabled={!estado || ocupado || !podeComprar} onClick={() => aoComprar(item)}>{podeComprar ? <><LockKeyhole size={17} aria-hidden="true" /> Desbloquear visual</> : 'Saldo insuficiente'}</button>}
      {possui && <button className="companheiro-acao" type="button" disabled={!estado || ocupado || equipada} onClick={() => aoEquipar(skinId)}>{equipada ? <><Check size={18} aria-hidden="true" /> Visual equipado</> : 'Equipar visual'}</button>}
    </section>

    <div className="companheiro-secao-titulo"><span><Sparkles aria-hidden="true" /></span><div><small>O QUE CADA UM FAZ</small><h2>Habilidades</h2></div></div>
    <div className="companheiro-habilidades"><Habilidade titulo={`HABILIDADE DE ${personagem.nome.toUpperCase()}`} habilidade={personagem.habilidade} Icone={IconePersonagem} />
      {skin.habilidade ? <Habilidade titulo="HABILIDADE DESTA SKIN" habilidade={skin.habilidade} Icone={IconeSkin} destaque />
        : <section className="companheiro-habilidade companheiro-habilidade--cosmetica"><span className="companheiro-habilidade-icone"><Sparkles aria-hidden="true" /></span><div><small>ESTILO PRÓPRIO</small><h3>Visual cosmético</h3><p>Esta skin muda a aparência. {personagem.nome} mantém sua habilidade de personagem.</p></div></section>}
    </div>
    {skinId === 'enfermeira-arara' && <button className="companheiro-usar" type="button" disabled={!equipada || usouHoje(skin.habilidade.id)} onClick={() => aoUsarHabilidade({ id: skin.habilidade.id, escopo: hoje })}>{usouHoje(skin.habilidade.id) ? 'Habilidade usada hoje' : equipada ? 'Usar Cura do Conhecimento' : 'Equipe a skin para usar'}</button>}
    {skinId === 'mila-pijama' && <button className="companheiro-usar" type="button" disabled={!equipada} onClick={() => aoUsarHabilidade({ id: skin.habilidade.id, escopo: hoje })}>Preparar revisão</button>}
    {skinId === 'historiador' && <p className="companheiro-nota">A aula de História da Libras está em preparação.</p>}

    <section className="companheiro-outros" aria-labelledby="companheiro-outros-titulo"><div className="companheiro-secao-titulo"><span><Star aria-hidden="true" /></span><div><small>EXPLORE A COLEÇÃO</small><h2 id="companheiro-outros-titulo">Visuais de {personagem.nome}</h2></div></div>
      <div className="companheiro-visuais">{skinsDoPersonagem.map(visual => <button className={`companheiro-visual companheiro-visual--${visual.id} ${visual.id === skinId ? 'companheiro-visual--ativo' : ''}`} type="button" key={visual.id} onClick={() => aoSelecionar(visual.id)} aria-pressed={visual.id === skinId}><Mascote skin={visual.id} tamanho="full" decorativo /><span>{visual.nome}</span>{visual.habilidade && <Sparkles size={14} aria-label="Habilidade especial" />}</button>)}</div>
    </section>
    <section className="companheiro-outros" aria-labelledby="companheiro-elenco-titulo"><div className="companheiro-secao-titulo"><span><Compass aria-hidden="true" /></span><div><small>QUEM VAI COM VOCÊ?</small><h2 id="companheiro-elenco-titulo">Outros personagens</h2></div></div>
      <div className="companheiro-elenco">{PERSONAGENS.filter(outro => outro.id !== personagem.id).map(outro => <button type="button" key={outro.id} onClick={() => aoSelecionar(outro.visualPadrao)}><Mascote skin={outro.visualPadrao} tamanho="full" decorativo /><span><strong>{outro.nome}</strong><small>{outro.especie}</small></span></button>)}</div>
    </section>
  </div>;
}
