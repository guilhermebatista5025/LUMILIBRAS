import { useEffect, useRef, useState } from 'react';
import { Check, ChevronRight, Coins, Gift, Heart, LockKeyhole, ShoppingBag, Sparkles, Star, X, Zap } from 'lucide-react';
import { Mascote } from '../components/mascote/index.js';
import { storeApi } from '../services/storeApi.js';
import diamante from '../assets/componentes/reaproveitamento-de-elementos/diamante.webp';
import medalhaXp from '../assets/componentes/reaproveitamento-de-elementos/medalha-xp.webp';
import './Loja.css';

const CATALOGO = [
  { id: 'recarga-diamantes', titulo: 'Corações cheios', descricao: 'Recupere todos os corações agora.', tipo: 'hearts', moeda: 'diamantes', preco: 20 },
  { id: 'recarga-moedas', titulo: 'Corações cheios', descricao: 'Recupere todos os corações agora.', tipo: 'hearts', moeda: 'moedas', preco: 80 },
  { id: 'xp-diamantes', titulo: 'Dobro de XP', descricao: 'A próxima recompensa em XP será dobrada.', tipo: 'boost', moeda: 'diamantes', preco: 45 },
  { id: 'xp-moedas', titulo: 'Dobro de XP', descricao: 'A próxima recompensa em XP será dobrada.', tipo: 'boost', moeda: 'moedas', preco: 140 },
  { id: 'aurora', titulo: 'Lumi Aurora', descricao: 'Um novo visual violeta para a Lumi.', tipo: 'skin', moeda: 'moedas', preco: 250 },
  { id: 'dourada', titulo: 'Lumi Dourada', descricao: 'Um brilho dourado para acompanhar sua jornada.', tipo: 'skin', moeda: 'diamantes', preco: 100 },
];

function Preco({ item }) {
  return <span className={`loja-preco loja-preco--${item.moeda}`}>
    {item.moeda === 'diamantes' ? <img src={diamante} alt="" /> : <Coins aria-hidden="true" />}
    {item.preco} <span className="sr-only">{item.moeda}</span>
  </span>;
}

function Arte({ item }) {
  if (item.tipo === 'skin') return <span className={`loja-skin-arte loja-skin-arte--${item.id}`}><Mascote pose="joia" tamanho="full" decorativo /></span>;
  if (item.tipo === 'boost') return <span className="loja-boost-arte"><img src={medalhaXp} alt="" /><Zap aria-hidden="true" /></span>;
  return <span className="loja-coracao-arte"><Heart aria-hidden="true" fill="currentColor" /><Sparkles aria-hidden="true" /></span>;
}

export function Loja({ game, aoAtualizarJogo }) {
  const [estado, setEstado] = useState(null);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const [selecionado, setSelecionado] = useState(null);
  const [mensagem, setMensagem] = useState('');
  const dialogoRef = useRef(null);
  const tentativaRef = useRef(null);

  useEffect(() => {
    let ativo = true;
    storeApi.state().then(dados => {
      if (ativo) { setEstado(dados); setErro(''); document.documentElement.dataset.lumiSkin = dados.skinAtiva; }
    }).catch(error => { if (ativo) setErro(error.message); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);

  useEffect(() => {
    if (selecionado && !dialogoRef.current?.open) dialogoRef.current?.showModal();
  }, [selecionado]);

  function fechar() { dialogoRef.current?.close(); setSelecionado(null); }

  async function executar(item) {
    if (ocupado || !estado) return;
    setOcupado(true);
    setMensagem('');
    try {
      const jaPossui = item.tipo === 'skin' && estado.skins.includes(item.id);
      const dados = jaPossui ? await storeApi.equip(item.id) : await storeApi.buy(
        item.id, tentativaRef.current?.itemId === item.id
          ? tentativaRef.current.eventId
          : (tentativaRef.current = { itemId: item.id, eventId: crypto.randomUUID() }).eventId,
      );
      tentativaRef.current = null;
      setEstado(dados);
      document.documentElement.dataset.lumiSkin = dados.skinAtiva;
      setMensagem(dados.mensagem || 'Skin equipada!');
      aoAtualizarJogo();
      fechar();
    } catch (error) {
      setMensagem(error.message);
      fechar();
    } finally { setOcupado(false); }
  }

  const itens = estado?.itens || CATALOGO;
  const diamantes = estado?.diamantes ?? game.estatisticas.diamantes;
  const moedas = estado?.moedas;
  const coracoes = estado?.coracoes ?? game.estatisticas.coracoes;
  const maxCoracoes = estado?.maxCoracoes ?? game.estatisticas.maxCoracoes;
  const possui = item => item.tipo === 'skin' && estado?.skins.includes(item.id);
  const ativo = item => item.tipo === 'skin' && estado?.skinAtiva === item.id;
  const semSaldo = item => estado && (item.moeda === 'diamantes' ? diamantes : moedas) < item.preco;
  const indisponivel = item => item.tipo === 'hearts' && coracoes >= maxCoracoes;
  const rotulo = item => ativo(item) ? 'Equipada' : possui(item) ? 'Equipar' : indisponivel(item) ? 'Corações cheios' : semSaldo(item) ? 'Saldo insuficiente' : 'Escolher';

  return <div className="loja-tela home-aba-conteudo">
    <header className="loja-cabecalho"><span className="loja-cabecalho-icone"><ShoppingBag aria-hidden="true" /></span><div><p>Seu cantinho de recompensas</p><h1>Loja da Lumi</h1></div></header>
    <section className="loja-hero" aria-label="Boas-vindas à loja">
      <div><span className="loja-etiqueta"><Sparkles size={14} aria-hidden="true" /> Escolha sua recompensa</span><h2>Aprender também rende conquistas!</h2><p>Troque o que você juntou por uma ajuda extra e novos visuais para a Lumi.</p></div>
      <Mascote pose="joia" tamanho="full" decorativo className="loja-hero-lumi" />
    </section>
    <section className="loja-saldos" aria-label="Seu saldo">
      <div><img src={diamante} alt="" /><span><small>Diamantes</small><strong>{game.versao < 0 ? '—' : diamantes}</strong></span></div>
      <div><Coins aria-hidden="true" /><span><small>Moedas</small><strong>{moedas ?? '—'}</strong></span></div>
    </section>
    <p className="loja-como-ganhar">Conclua fases para ganhar diamantes. Cada novo dia de acesso rende 10 moedas.</p>
    {carregando && <p className="loja-aviso" role="status">Carregando a loja…</p>}
    {erro && <p className="loja-aviso loja-aviso--erro" role="alert">{erro} As compras ficam disponíveis quando a loja estiver conectada.</p>}
    {mensagem && <p className="loja-aviso loja-aviso--sucesso" role="status">{mensagem}</p>}

    <section className="loja-secao" aria-labelledby="loja-energia"><div className="loja-secao-titulo"><span><Heart aria-hidden="true" /></span><div><p>Continue aprendendo</p><h2 id="loja-energia">Sua energia</h2></div><strong>{coracoes}/{maxCoracoes}</strong></div>
      <div className="loja-lista">{itens.filter(item => item.tipo === 'hearts').map(item => <article className="loja-item" key={item.id}><Arte item={item} /><div className="loja-item-info"><h3>{item.titulo}</h3><p>{item.descricao}</p><Preco item={item} /></div><button type="button" disabled={!estado || ocupado || indisponivel(item) || semSaldo(item)} onClick={() => setSelecionado(item)}>{rotulo(item)}<ChevronRight aria-hidden="true" /></button></article>)}</div>
    </section>

    <section className="loja-secao" aria-labelledby="loja-boost"><div className="loja-secao-titulo"><span className="loja-secao-icone--xp"><Zap aria-hidden="true" /></span><div><p>Um empurrãozinho para evoluir</p><h2 id="loja-boost">Boosts</h2></div>{estado?.boosts ? <strong>{estado.boosts} {estado.boosts === 1 ? 'disponível' : 'disponíveis'}</strong> : null}</div>
      <div className="loja-lista">{itens.filter(item => item.tipo === 'boost').map(item => <article className="loja-item" key={item.id}><Arte item={item} /><div className="loja-item-info"><h3>{item.titulo}</h3><p>{item.descricao}</p><Preco item={item} /></div><button type="button" disabled={!estado || ocupado || semSaldo(item)} onClick={() => setSelecionado(item)}>{rotulo(item)}<ChevronRight aria-hidden="true" /></button></article>)}</div>
    </section>

    <section className="loja-secao" aria-labelledby="loja-skins"><div className="loja-secao-titulo"><span className="loja-secao-icone--skin"><Star aria-hidden="true" /></span><div><p>Deixe a Lumi do seu jeito</p><h2 id="loja-skins">Skins da Lumi</h2></div></div>
      <div className="loja-skins"><article className="loja-skin-card loja-skin-card--classica"><Arte item={{ id: 'classica', tipo: 'skin' }} /><h3>Lumi Clássica</h3><p>O visual que acompanha você desde o começo.</p><button type="button" disabled={!estado || ocupado || estado.skinAtiva === 'classica'} onClick={async () => { setOcupado(true); try { const dados = await storeApi.equip('classica'); setEstado(dados); document.documentElement.dataset.lumiSkin = 'classica'; setMensagem('Skin equipada!'); } catch (error) { setMensagem(error.message); } finally { setOcupado(false); } }}>{estado?.skinAtiva === 'classica' ? <><Check size={16} /> Equipada</> : 'Equipar'}</button></article>
        {itens.filter(item => item.tipo === 'skin').map(item => <article className="loja-skin-card" key={item.id}><Arte item={item} /><h3>{item.titulo}</h3><p>{item.descricao}</p><Preco item={item} /><button type="button" disabled={!estado || ocupado || ativo(item) || (!possui(item) && semSaldo(item))} onClick={() => possui(item) ? executar(item) : setSelecionado(item)}>{ativo(item) ? <><Check size={16} /> Equipada</> : possui(item) ? 'Equipar' : semSaldo(item) ? <><LockKeyhole size={15} /> Saldo insuficiente</> : 'Desbloquear'}</button></article>)}
      </div>
    </section>

    <aside className="loja-rodape"><Gift aria-hidden="true" /><p>Cada conquista começa com um sinal. Continue praticando para juntar mais recompensas!</p></aside>
    <dialog ref={dialogoRef} className="loja-dialogo" onClose={() => setSelecionado(null)} onClick={event => { if (event.target === event.currentTarget) fechar(); }} aria-labelledby="loja-dialogo-titulo">
      {selecionado && <div><button className="loja-dialogo-fechar" type="button" onClick={fechar} aria-label="Fechar"><X aria-hidden="true" /></button><Arte item={selecionado} /><h2 id="loja-dialogo-titulo">{selecionado.titulo}</h2><p>{selecionado.descricao}</p><div className="loja-dialogo-total"><span>Seu saldo: {selecionado.moeda === 'diamantes' ? diamantes : moedas} {selecionado.moeda}</span><Preco item={selecionado} /></div><button className="loja-confirmar" type="button" disabled={ocupado} onClick={() => executar(selecionado)}>{ocupado ? 'Confirmando…' : 'Confirmar troca'}</button></div>}
    </dialog>
  </div>;
}
