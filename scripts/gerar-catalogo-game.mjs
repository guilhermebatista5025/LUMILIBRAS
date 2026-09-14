import { writeFileSync } from 'node:fs';
import { obterFases } from '../src/data/aprendizado.js';

const quote = value => `'${String(value).replaceAll("'", "''")}'`;
let anterior = null;
const linhas = ['-- Gerado de treinamento-saude.json por scripts/gerar-catalogo-game.mjs', 'begin;'];
for (let unidade = 1; unidade <= 13; unidade++) {
  for (const fase of obterFases('saude', unidade)) {
    const id = `saude:${unidade}:${fase.id}`;
    linhas.push(`insert into lumi_game.phases(id,previous_id,kind,study_ids,pair_ids,answers,xp,diamonds) values (${quote(id)},${anterior ? quote(anterior) : 'null'},${quote(fase.tipo)},${quote(JSON.stringify(fase.tipo === 'estudo' ? fase.questoes.map(q => q.id) : []))}::jsonb,${quote(JSON.stringify(fase.pares?.map(q => q.id) || []))}::jsonb,${quote(JSON.stringify(fase.tipo === 'avaliacao' ? fase.questoes.map(q => q.correta) : []))}::jsonb,${fase.xp},5);`);
    anterior = id;
  }
}
linhas.push('commit;', '');
writeFileSync(new URL('../supabase/migrations/20260914100100_game_catalog.sql', import.meta.url), linhas.join('\n'));
console.log('Catálogo SQL gerado: 64 fases, sem gabarito exposto pela API pública.');
