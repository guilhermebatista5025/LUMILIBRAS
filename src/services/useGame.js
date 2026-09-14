import { useCallback, useEffect, useRef, useState } from 'react';
import { gameAction, GAME_VAZIO } from './gameApi.js';

export function useGame() {
  const [game, setGame] = useState(GAME_VAZIO);
  const [erro, setErro] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [ocupado, setOcupado] = useState(false);
  const emEnvio = useRef(false);
  const pendente = useRef(null);
  const ativo = useRef(true);
  const aplicar = useCallback(dados => {
    if (ativo.current) { setGame(anterior => dados.versao >= anterior.versao ? dados : anterior); setErro(''); }
    return dados;
  }, []);
  const carregar = useCallback(async () => {
    if (emEnvio.current) return;
    try { aplicar(await gameAction('visit')); }
    catch (error) { if (ativo.current) setErro(error.message); }
    finally { if (ativo.current) setCarregando(false); }
  }, [aplicar]);
  useEffect(() => {
    ativo.current = true;
    carregar();
    const intervalo = setInterval(() => { if (!document.hidden) carregar(); }, 60_000);
    const focar = () => { if (!document.hidden) carregar(); };
    document.addEventListener('visibilitychange', focar);
    return () => { ativo.current = false; clearInterval(intervalo); document.removeEventListener('visibilitychange', focar); };
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
