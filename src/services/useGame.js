import { useCallback, useEffect, useRef, useState } from 'react';
import { gameAction, GAME_VAZIO, ESTATISTICAS_VAZIAS } from './gameApi.js';

export function useGame() {
  const [game, setGame] = useState(GAME_VAZIO);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const emEnvio = useRef(false);
  const carregamentoEmCurso = useRef(null);
  const pendente = useRef(null);
  const ativo = useRef(true);
  const ultimoEstado = useRef(GAME_VAZIO);
  const aplicar = useCallback(dados => {
    const anterior = ultimoEstado.current;
    const estado = {
      ...GAME_VAZIO,
      ...dados,
      estatisticas: { ...ESTATISTICAS_VAZIAS, ...anterior.estatisticas, ...dados?.estatisticas },
      aprendizado: dados?.aprendizado && typeof dados.aprendizado === 'object' && !Array.isArray(dados.aprendizado) ? dados.aprendizado : anterior.aprendizado,
    };
    if (estado.versao >= anterior.versao) {
      ultimoEstado.current = estado;
      if (ativo.current) { setGame(estado); setErro(''); }
    }
    return ultimoEstado.current;
  }, []);
  const carregar = useCallback(async () => {
    if (emEnvio.current) return ultimoEstado.current;
    if (carregamentoEmCurso.current) return carregamentoEmCurso.current;
    const requisicao = gameAction('visit')
      .then(aplicar)
      .catch(error => {
        if (ativo.current) setErro(error.message);
        return ultimoEstado.current;
      })
      .finally(() => {
        carregamentoEmCurso.current = null;
        if (ativo.current) setCarregando(false);
      });
    carregamentoEmCurso.current = requisicao;
    return requisicao;
  }, [aplicar]);
  useEffect(() => {
    ativo.current = true;
    // O pequeno adiamento evita o POST duplicado pela verificacao de efeitos do StrictMode.
    const inicial = setTimeout(carregar, 0);
    const intervalo = setInterval(() => { if (!document.hidden) carregar(); }, 60_000);
    const focar = () => { if (!document.hidden) carregar(); };
    document.addEventListener('visibilitychange', focar);
    window.addEventListener('focus', focar);
    return () => { ativo.current = false; clearTimeout(inicial); clearInterval(intervalo); document.removeEventListener('visibilitychange', focar); window.removeEventListener('focus', focar); };
  }, [carregar]);
  async function enviar(action, phase, payload = {}) {
    if (emEnvio.current) throw new Error('Aguarde a confirmação da atividade anterior.');
    emEnvio.current = true; setOcupado(true);
    const assinatura = JSON.stringify({ action, phase, payload });
    if (pendente.current?.assinatura !== assinatura) pendente.current = { assinatura, id: crypto.randomUUID() };
    try {
      const dados = await gameAction(action, phase, payload, pendente.current.id);
      pendente.current = null;
      return aplicar(dados);
    } catch (error) {
      if (ativo.current) setErro(error.message);
      throw error;
    } finally { emEnvio.current = false; if (ativo.current) setOcupado(false); }
  }
  return { game, erro, carregando, ocupado, enviar, recarregar: carregar };
}
