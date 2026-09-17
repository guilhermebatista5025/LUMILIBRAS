import { useEffect, useState } from 'react';
import { BookOpen, Check, X } from 'lucide-react';
import { obterFases } from '../data/aprendizado.js';
import { abilitiesApi } from '../services/abilitiesApi.js';
import { PERSONAGENS, SKINS } from '../data/companheiros.js';
import './RevisaoHabilidade.css';

const NOMES = [...PERSONAGENS.map(personagem => personagem.habilidade), ...SKINS.map(skin => skin.habilidade).filter(Boolean)];

function questaoDaReferencia(referencia) {
  const partes = referencia.fase?.split(':');
  if (partes?.[0] !== 'saude') return null;
  const fase = obterFases('saude', Number(partes[1])).find(item => item.id === partes[2]);
  return fase?.questoes[referencia.indice] || null;
}

export function RevisaoHabilidade({ habilidadeId, escopo, aoFechar, aoConcluir }) {
  const [revisao, setRevisao] = useState(null);
  const [respostas, setRespostas] = useState([]);
  const [erro, setErro] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const nome = NOMES.find(habilidade => habilidade.id === habilidadeId)?.nome || 'Revisão';

  useEffect(() => {
    let ativo = true;
    abilitiesApi.review(habilidadeId, escopo).then(dados => { if (ativo) setRevisao(dados); })
      .catch(error => { if (ativo) setErro(error.message); });
    return () => { ativo = false; };
  }, [habilidadeId, escopo]);

  const questoes = revisao?.questoes?.map(questaoDaReferencia) || [];
  async function concluir() {
    if (ocupado || questoes.some((_, indice) => respostas[indice] === undefined)) return;
    setOcupado(true); setErro('');
    try {
      const dados = await abilitiesApi.review(habilidadeId, escopo, respostas);
      setRevisao(anterior => ({ ...anterior, concluida: true, resultado: dados.resultado }));
      aoConcluir?.(dados);
    } catch (error) { setErro(error.message); }
    finally { setOcupado(false); }
  }

  return <div className="revisao-habilidade-fundo" role="presentation">
    <section className="revisao-habilidade" role="dialog" aria-modal="true" aria-labelledby="revisao-habilidade-titulo">
      <header><BookOpen aria-hidden="true" /><div><p>Habilidade do companheiro</p><h2 id="revisao-habilidade-titulo">{nome}</h2></div><button type="button" onClick={aoFechar} aria-label="Fechar revisão"><X aria-hidden="true" /></button></header>
      {erro && <p className="revisao-habilidade-erro" role="alert">{erro}</p>}
      {!revisao && !erro && <p role="status">Preparando sinais estudados…</p>}
      {revisao?.concluida ? <div className="revisao-habilidade-resultado" role="status"><Check aria-hidden="true" /><h3>Revisão concluída</h3><p>{revisao.resultado?.acertos ?? 0}/{revisao.resultado?.total ?? 0} acertos · +{revisao.resultado?.xp ?? 0} XP · +{revisao.resultado?.moedas ?? 0} moedas · +{revisao.resultado?.coracoes ?? 0} coração</p><button type="button" onClick={aoFechar}>Continuar</button></div> : <>
        {revisao && <p>Observe os sinais e responda você mesmo. A habilidade não marca respostas automaticamente.</p>}
        <div className="revisao-habilidade-lista">{questoes.map((questao, indice) => questao ? <fieldset key={`${indice}-${questao.id}`}><legend>Sinal {indice + 1}</legend><img src={questao.imagem} alt={`Sequência do sinal ${indice + 1}`} /><div>{questao.alternativas.map((alternativa, opcao) => <label key={opcao}><input type="radio" name={`revisao-${indice}`} checked={respostas[indice] === opcao} onChange={() => setRespostas(anteriores => { const novas = [...anteriores]; novas[indice] = opcao; return novas; })} />{alternativa}</label>)}</div></fieldset> : null)}</div>
        {revisao && questoes.some(questao => !questao) && <p role="alert">Uma referência desta revisão não está disponível neste app. Feche e tente novamente após atualizar a página.</p>}
        {revisao && <button className="revisao-habilidade-confirmar" type="button" disabled={ocupado || questoes.some(questao => !questao) || questoes.some((_, indice) => respostas[indice] === undefined)} onClick={concluir}>{ocupado ? 'Conferindo…' : 'Conferir minhas respostas'}</button>}
      </>}
    </section>
  </div>;
}
