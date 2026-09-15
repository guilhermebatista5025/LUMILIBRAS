import { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, Check, ImagePlus, RotateCcw, RotateCw, X, ZoomIn, ZoomOut } from 'lucide-react';
import { AvatarPerfil } from './AvatarPerfil.jsx';
import { carregarFoto, desenharRecorte, exportarFoto, girarFoto, recorteFoto } from '../lib/avatarCrop.js';
import { profileApi } from '../services/profileApi.js';
import './FotoPerfilControle.css';

function EditorFoto({ imagem, aoCancelar, aoTrocar, aoSalvar }) {
  const dialogRef = useRef(null), canvasRef = useRef(null), pontos = useRef(new Map()), enviando = useRef(false);
  const [zoom, setZoom] = useState(1), [giro, setGiro] = useState(0), [centro, setCentro] = useState({ x:.5, y:.5 });
  const [salvando, setSalvando] = useState(false), [erro, setErro] = useState('');
  const fonte = useMemo(() => girarFoto(imagem, giro), [imagem, giro]);
  const recorte = recorteFoto(fonte.width, fonte.height, zoom, centro);

  useEffect(() => {
    const dialog = dialogRef.current;
    const anterior = document.activeElement, overflow = document.body.style.overflow;
    dialog.showModal();
    document.body.style.overflow = 'hidden';
    return () => { dialog.close(); document.body.style.overflow = overflow; anterior?.focus(); };
  }, []);
  useEffect(() => { desenharRecorte(canvasRef.current, fonte, recorteFoto(fonte.width, fonte.height, zoom, centro)); }, [fonte, zoom, centro]);

  function ajustarZoom(valor) {
    setCentro(recorte.centro);
    setZoom(Math.max(1, Math.min(4, valor)));
  }
  function mover(dx, dy) {
    const tamanho = canvasRef.current.getBoundingClientRect().width;
    setCentro({ x: recorte.centro.x - dx / tamanho * recorte.lado / fonte.width,
      y: recorte.centro.y - dy / tamanho * recorte.lado / fonte.height });
  }
  function arrastar(evento) {
    if (salvando || !pontos.current.has(evento.pointerId)) return;
    const anteriores = [...pontos.current.values()];
    const anterior = pontos.current.get(evento.pointerId);
    pontos.current.set(evento.pointerId, { x:evento.clientX, y:evento.clientY });
    const atuais = [...pontos.current.values()];
    if (atuais.length === 2) {
      const distancia = p => Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      const base = distancia(anteriores);
      if (base > 0) ajustarZoom(zoom * distancia(atuais) / base);
    } else mover(evento.clientX - anterior.x, evento.clientY - anterior.y);
  }
  function teclado(evento) {
    const movimentos = { ArrowLeft:[-10,0], ArrowRight:[10,0], ArrowUp:[0,-10], ArrowDown:[0,10] };
    if (movimentos[evento.key] && !salvando) { evento.preventDefault(); mover(...movimentos[evento.key]); }
  }
  async function salvar() {
    if (enviando.current) return;
    enviando.current = true; setSalvando(true); setErro('');
    try { await aoSalvar(await exportarFoto(fonte, recorte)); }
    catch (error) { setErro(error.message || 'Não foi possível salvar sua foto. Tente novamente.'); }
    finally { enviando.current = false; setSalvando(false); }
  }
  return <dialog ref={dialogRef} className="foto-editor" aria-labelledby="foto-editor-titulo" onCancel={evento => { evento.preventDefault(); if (!salvando) aoCancelar(); }}>
    <header><div><p>Sua foto de perfil</p><h2 id="foto-editor-titulo">Ajuste sua foto</h2></div><button type="button" onClick={aoCancelar} disabled={salvando} aria-label="Cancelar edição da foto"><X /></button></header>
    <p id="foto-editor-instrucao" className="foto-editor-instrucao">Arraste para posicionar e ajuste o zoom. O círculo mostra como sua foto vai aparecer.</p>
    <div className="foto-editor-recorte" tabIndex={salvando ? -1 : 0} role="group" aria-label="Posição da foto: use as setas do teclado para mover" aria-describedby="foto-editor-instrucao"
      onKeyDown={teclado} onPointerDown={evento => { if (salvando) return; evento.currentTarget.setPointerCapture(evento.pointerId); pontos.current.set(evento.pointerId, { x:evento.clientX, y:evento.clientY }); }}
      onPointerMove={arrastar} onPointerUp={evento => pontos.current.delete(evento.pointerId)} onPointerCancel={evento => pontos.current.delete(evento.pointerId)} onLostPointerCapture={evento => pontos.current.delete(evento.pointerId)}>
      <canvas ref={canvasRef} width="512" height="512" aria-hidden="true" /><div className="foto-editor-circulo" aria-hidden="true" />
    </div>
    <div className="foto-editor-zoom"><ZoomOut aria-hidden="true" /><label htmlFor="foto-zoom">Zoom <output>{Math.round(zoom * 100)}%</output></label><input id="foto-zoom" type="range" min="1" max="4" step="0.01" value={zoom} disabled={salvando} onChange={evento => ajustarZoom(Number(evento.target.value))} /><ZoomIn aria-hidden="true" /></div>
    <div className="foto-editor-ferramentas"><button type="button" disabled={salvando} onClick={() => { setGiro(valor => (valor + 1) % 4); setCentro({ x:.5,y:.5 }); setZoom(1); }}><RotateCw /> Girar</button><button type="button" disabled={salvando} onClick={() => { setGiro(0); setZoom(1); setCentro({ x:.5,y:.5 }); }}><RotateCcw /> Redefinir</button><button type="button" disabled={salvando} onClick={aoTrocar}><ImagePlus /> Trocar foto</button></div>
    {erro && <p className="foto-editor-erro" role="alert">{erro}</p>}
    <footer><button type="button" className="foto-editor-cancelar" onClick={aoCancelar} disabled={salvando}>Cancelar</button><button type="button" className="foto-editor-salvar" onClick={salvar} disabled={salvando}><Check /> {salvando ? 'Salvando…' : 'Salvar foto'}</button></footer>
  </dialog>;
}

export function FotoPerfilControle({ fotoUrl, aoFotoSalva }) {
  const inputRef = useRef(null), selecaoRef = useRef(0);
  const [imagem, setImagem] = useState(null), [aviso, setAviso] = useState(''), [erro, setErro] = useState(''), [carregando, setCarregando] = useState(false);
  useEffect(() => () => { selecaoRef.current++; }, []);
  async function escolher(evento) {
    const arquivo = evento.target.files?.[0];
    evento.target.value = '';
    if (!arquivo) return;
    const pedido = ++selecaoRef.current;
    setCarregando(true); setErro(''); setAviso('');
    try { const foto = await carregarFoto(arquivo); if (pedido === selecaoRef.current) setImagem(foto); }
    catch (error) { if (pedido === selecaoRef.current) setErro(error.message); }
    finally { if (pedido === selecaoRef.current) setCarregando(false); }
  }
  async function salvar(arquivo) {
    const resultado = await profileApi.salvarFoto(arquivo);
    aoFotoSalva(resultado.fotoUrl);
    setImagem(null); setAviso('Foto salva com sucesso.');
  }
  return <div className="foto-perfil-controle">
    <div className="perfil-avatar-wrap"><div className="perfil-avatar"><AvatarPerfil fotoUrl={fotoUrl} /></div><button type="button" className="foto-perfil-camera" onClick={() => inputRef.current.click()} disabled={carregando} aria-label="Alterar foto de perfil"><Camera aria-hidden="true" /></button></div>
    <input ref={inputRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={escolher} hidden aria-label="Escolher foto de perfil" />
    {carregando && <span className="foto-perfil-status" role="status">Abrindo foto…</span>}
    {aviso && <span className="foto-perfil-status" role="status">{aviso}</span>}
    {erro && <span className="foto-perfil-erro" role="alert">{erro}</span>}
    {imagem && <EditorFoto key={selecaoRef.current} imagem={imagem} aoCancelar={() => setImagem(null)} aoTrocar={() => { setImagem(null); inputRef.current.click(); }} aoSalvar={salvar} />}
  </div>;
}
