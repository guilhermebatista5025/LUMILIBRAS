import { useEffect, useState } from 'react';
import { ArrowLeft, Check, Clock3, Search, UserPlus, Users } from 'lucide-react';
import { socialApi } from '../services/socialApi.js';
import './Social.css';

const regions = ['AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG','PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO'];

export function BuscaAmigos({ aoVoltar }) {
  const [query, setQuery] = useState('');
  const [people, setPeople] = useState([]);
  const [region, setRegion] = useState('');
  const [busy, setBusy] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    socialApi.settings().then(({ settings }) => { if (active) setRegion(settings.region || ''); }).catch(err => { if (active) setError(err.message); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    let active = true;
    const timer = setTimeout(() => {
      setLoading(true);
      socialApi.findFriends(query).then(({ people: found }) => { if (active) { setPeople(found); setError(''); } }).catch(err => { if (active) setError(err.message); }).finally(() => { if (active) setLoading(false); });
    }, 250);
    return () => { active = false; clearTimeout(timer); };
  }, [query]);

  async function act(person) {
    const action = person.relationship === 'received' ? 'accept' : person.relationship === 'none' ? 'request' : 'remove';
    setBusy(person.id); setError('');
    try {
      await socialApi.friendAction(person.id, action);
      setPeople(current => current.map(item => item.id === person.id ? { ...item, relationship: action === 'accept' ? 'friend' : action === 'request' ? 'sent' : 'none' } : item));
    } catch (err) { setError(err.message); }
    finally { setBusy(null); }
  }

  async function saveRegion(value) {
    const previous = region;
    setRegion(value); setError('');
    try { await socialApi.saveSettings({ region: value || null }); }
    catch (err) { setRegion(previous); setError(err.message); }
  }

  return <div className="social-page home-aba-conteudo">
    <header className="social-header"><button type="button" onClick={aoVoltar} aria-label="Voltar ao perfil"><ArrowLeft /></button><h1>Buscar amigos</h1><Users /></header>
    <p className="social-intro">Encontre quem também está aprendendo Libras.</p>
    <label className="social-search"><Search aria-hidden="true" /><input type="search" value={query} maxLength={80} onChange={event => setQuery(event.target.value)} placeholder="Buscar por nome" aria-label="Buscar por nome" /></label>
    <div className="social-region"><label htmlFor="social-uf">Sua região para o ranking</label><select id="social-uf" value={region} onChange={event => saveRegion(event.target.value)}><option value="">Selecionar estado</option>{regions.map(uf => <option key={uf} value={uf}>{uf}</option>)}</select></div>
    <section className="social-people" aria-label="Pessoas no LumiLibras"><h2>{query ? 'Resultados' : 'Pessoas para conhecer'}</h2>
      {loading ? <p role="status">Buscando pessoas…</p> : !people.length ? <p>Nenhuma pessoa encontrada.</p> : people.map(person => <article key={person.id} className="social-person"><span className="social-person-avatar">{person.nome?.split(/\s+/).slice(0,2).map(part => part[0]).join('').toUpperCase()}</span><div><strong>{person.nome}</strong><small>{person.relationship === 'friend' ? 'Seu amigo' : person.relationship === 'received' ? 'Enviou um convite' : person.relationship === 'sent' ? 'Convite enviado' : 'Estudante de Libras'}</small></div><button type="button" disabled={busy === person.id} onClick={() => act(person)} className={person.relationship === 'friend' ? 'is-friend' : ''}>{person.relationship === 'friend' ? <><Check /> Remover</> : person.relationship === 'sent' ? <><Clock3 /> Cancelar</> : person.relationship === 'received' ? 'Aceitar' : <><UserPlus /> Adicionar</>}</button></article>)}
    </section>
    {error && <p className="social-error" role="alert">{error}</p>}
    <aside className="social-tip"><Users /><div><strong>Aprender é melhor junto!</strong><p>Adicione amigos e acompanhe a evolução de vocês no ranking.</p></div></aside>
  </div>;
}
