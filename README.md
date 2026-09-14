# LumiLibras

Aplicação web para aprendizagem de Libras, construída com React, Vite, JavaScript, Tailwind CSS, Node.js, Express e API REST.

## Requisitos

- Node.js 20.19 ou superior
- npm 10 ou superior

## Desenvolvimento

```bash
npm install
npm run dev
```

O frontend abre em `http://localhost:5173` e a API em `http://localhost:3001/api`.

Para testar com um túnel HTTPS, inicie a API com `NODE_ENV=development`,
`CLIENT_ORIGIN` igual à URL exata do túnel e `TRUST_PROXY=loopback` quando o
proxy roda nesta máquina. Assim, o acesso local continua permitido e os cookies
funcionam em HTTP local. No Vite, defina
`__VITE_ADDITIONAL_SERVER_ALLOWED_HOSTS` com o hostname do túnel.
Use `TRUST_PROXY` apenas para endereços de proxies confiáveis.

## Comandos

- `npm run dev`: inicia frontend e API juntos
- `npm run dev:client`: inicia somente o Vite
- `npm run dev:server`: inicia somente a API com recarregamento automático
- `npm run build`: gera o frontend de produção em `dist/`
- `npm start`: inicia somente o servidor Express
- `npm run check`: valida a marca e gera o build

## Estrutura

```text
src/
  assets/       imagens, ícones e fontes exportados
  components/   componentes React reutilizáveis, incluindo o mascote
  pages/        telas completas
server/
  routes/       endpoints da API REST
scripts/        verificações automatizadas do projeto
```

Ao trazer uma nova tela do Google Stitch, coloque imagens e fontes em `src/assets`, divida elementos repetidos em `src/components` e mantenha a composição da tela em `src/pages`.

As telas convertidas estão em `src/pages/SplashScreen.jsx`, `src/pages/BoasVindas.jsx`, `src/pages/Login.jsx` e `src/pages/Cadastro.jsx`. A splash é exibida ao iniciar e avança automaticamente para as boas-vindas. As ações de entrar, cadastrar e voltar já navegam entre as telas.

A identidade visual é centralizada em `src/components/LogoLumiLibras.jsx`: `Lumi` é sempre azul e `Libras` é sempre verde.

## Supabase e documentos legais

A autenticação por e-mail e senha passa pelo Express e pelo Supabase Auth. Consulte `README-2.0.md` para configuração, inventário de dados, Política de Privacidade e Termos de Uso. A migração inicial está em `supabase/migrations/20260910120000_create_profiles.sql`.

Ícones de empresas devem vir de fontes oficiais. A origem e o uso de cada arquivo ficam documentados em `src/assets/brands/README.md`.

## Trilhas por categoria

Cada card em Categorias abre uma trilha própria. O catálogo fica em
`src/data/cursos.js`: saúde tem 13 unidades e 139 sinais, conforme o índice
da cartilha local; básico, intermediário e avançado têm 8 módulos cada;
história tem 6. Os roteiros das quatro últimas categorias são propostas de
organização e suas aulas estão indicadas como em preparação.

Cada unidade abre uma trilha de fases. Apenas a primeira unidade e sua primeira
fase começam liberadas. Em saúde, cada fase de estudo apresenta até três sinais
originais e uma atividade de associação; a última fase avalia todos os sinais
da unidade. A próxima unidade só libera após concluir os estudos e alcançar
pelo menos 80% na avaliação. O gabarito aparece apenas no resultado final.

As cinco telas de referência em `telas-para-converter` foram convertidas em React:
detalhes da lição em `TrilhaUnidade.jsx`, introdução, associação, múltipla escolha
e conclusão em `AtividadeSaude.jsx`. Usam os tokens visuais do app, os mascotes
originais, os cinco vídeos locais e as 139 imagens extraídas do PDF de treinamento.
Os HTMLs são preservados como referência de design, sem depender do CDN Tailwind
ou das imagens ilustrativas externas para executar as atividades.

O conteúdo e o gabarito ficam em `src/data/treinamento-saude.json`, as imagens em
`public/treinamento/sinais` e o PDF original também em `public`. Para regenerar
os dados, instale `pypdf` e `Pillow` e execute `py scripts/extrair-treinamento.py`.
O extrator confere cada alternativa correta com o gabarito e preserva as imagens.
As associações são exercícios complementares montados com esses mesmos sinais;
a avaliação mantém as 139 questões originais do treinamento.

O progresso, respostas parciais, XP, diamantes, corações e acessos são persistidos
no Supabase, por conta autenticada. A API `POST /api/game` chama a função
`public.lumi_game_action`; as validações, os bloqueios sequenciais e os prêmios
ocorrem em uma transação no banco. O navegador só avança após a confirmação.
Repetir uma requisição com o mesmo evento não cobra corações nem premia novamente.
O histórico local das versões anteriores não é importado; não libera fases nem
conquistas. A aula prática final do PDF continua reservada para desenvolvimento
posterior e não faz parte das avaliações implementadas.

### Pontuação e conquistas

As duas migrações de gamificação, aplicadas nesta ordem, estão em:

1. `supabase/migrations/20260914100000_game.sql`: tabelas privadas e função autenticada.
2. `supabase/migrations/20260914100100_game_catalog.sql`: catálogo das 64 fases de saúde.

Elas pressupõem o Supabase Auth e a tabela existente `public.profiles`, com
`id` e `display_name`. Não precisam de service-role no frontend. Não execute
novamente migrações já aplicadas.

Regras iniciais:

- XP e diamantes começam em zero; cinco corações por conta.
- Cada fase concluída pela primeira vez rende cinco diamantes. O estudo rende
  cinco XP por sinal; a avaliação aprovada rende dez XP por questão.
- Cada resposta errada na avaliação consome um coração; a associação permite
  novas tentativas sem consumir. Com zero corações a avaliação pausa, mas é
  possível estudar sinais e o rascunho fica salvo.
- Recupera um coração a cada 30 minutos, até cinco, inclusive fora do app.
  Os valores são recalculados no próximo acesso/ação e atualizados a cada minuto
  enquanto a tela estiver visível.
- Acesso conta uma vez por data em `America/Sao_Paulo`. Dias consecutivos
  aumentam a sequência; um dia sem acesso reinicia a sequência, sem apagar
  o total de dias nem o recorde.
- Nível começa em um e sobe a cada 100 XP. Ranking mostra contas reais com XP.
- As oito conquistas começam inativas e bloqueadas. Não existem prêmios
  automáticos com critérios de demonstração. Novas regras devem ser cadastradas
  em migrações após a definição dos contextos pelo responsável.

`lumi_game.achievements` suporta critérios `xp`, `login_days`, `streak`,
`phases` e `perfect`, meta positiva e prêmios em XP/diamantes. O campo
`active` permanece falso até autorização para ativar uma regra.
O desbloqueio é verificado nas ações/acessos e a recompensa é única por conta.
O ranking usa o nome de exibição, sem e-mail. As tabelas não são acessíveis
diretamente pelos papéis `anon` ou `authenticated`; a função usa
`auth.uid()` e `search_path` vazio.

As metas da aba Praticar exibem fases e XP do dia; não dão bônus separados.
A meta de minutos é uma preferência de estudo, sem tempo fictício acumulado.
Sem conexão, a tela avisa e não substitui o banco por progresso local.

### Testes do banco

Para executar as migrações reais em PostgreSQL descartável (PGlite), sem acessar
ou alterar o banco de produção:

```powershell
npm install --prefix .runtime/game-db-test --no-audit --no-fund @electric-sql/pglite@0.5.8
npm run test:game
```

Os testes verificam persistência, isolamento por usuário, permissões, corações,
recuperação, sequência, aprovação, bloqueios, idempotência e conquistas futuras.
Para regenerar o catálogo SQL após alterar os conteúdos, execute
`node scripts/gerar-catalogo-game.mjs`; em um banco já instalado, publique uma
nova migração incremental em vez de executar novamente a migração original.

Execute `npm run test:aprendizado` para validar cobertura do conteúdo, imagens,
nota mínima, sequência de fases, bloqueios e separação das chaves por usuário.

## Mascote

As nove poses disponíveis ficam centralizadas no componente `Mascote`:

```jsx
import { Mascote, MascoteMensagem } from "./components/mascote";

<Mascote pose="boas_vindas" tamanho="lg" animado />

<MascoteMensagem pose="otimo" titulo="Muito bem!">
  Você concluiu esta etapa.
</MascoteMensagem>
```

Poses: `assustado`, `boas_vindas`, `brava`, `curiosa`, `joia`, `otimo`, `palmas`, `sono` e `triste`.
