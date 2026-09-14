# LumiLibras — guia de construção, arquitetura e continuidade

Versão do documento: `2026-09-11-v3`
Última atualização: 11 de setembro de 2026
Status do produto: protótipo funcional em evolução

Este documento explica como reconstruir, compreender e continuar a LumiLibras. Ele registra o raciocínio de produto e de engenharia por trás das telas, componentes, animações, autenticação, banco de dados e decisões visuais.

O objetivo é permitir que outra pessoa assuma o projeto sem depender do histórico de conversas. O documento diferencia o que está funcionando, o que ainda é demonstrativo e o que precisa ser corrigido antes de produção.

> A Política de Privacidade, os Termos de Uso e o inventário jurídico de dados continuam em `README-2.0.md`. Este arquivo é o guia técnico e de implementação.

## 1. Visão do produto

A LumiLibras é uma aplicação web mobile-first para ensinar e praticar Língua Brasileira de Sinais de forma acessível, leve e gamificada.

O produto combina quatro ideias principais:

1. reduzir a ansiedade inicial com uma identidade amigável e o mascote Lumi;
2. conhecer o usuário antes de recomendar conteúdo;
3. transformar frequência e progresso em elementos visuais fáceis de entender;
4. utilizar vídeos e materiais de Libras como conteúdo educacional real.

O fluxo atual permite criar uma conta, entrar, responder ao onboarding, persistir as preferências no Supabase e acessar as experiências de aprendizado e prática.

## 2. Princípios usados para tomar decisões

Ao construir ou alterar uma funcionalidade, siga esta ordem:

1. **Defina o problema do usuário.** Exemplo: “o usuário não entende em qual etapa está”.
2. **Defina o estado necessário.** Exemplo: etapa atual, etapas concluídas e dados já escolhidos.
3. **A interface não deve inventar nomes diferentes para o mesmo dado em cada camada.**
4. **Monte primeiro a estrutura sem animação.** Garanta alinhamento, responsividade, teclado e estados de erro.
5. **Adicione movimento para explicar a mudança.** A animação deve indicar origem, destino ou progresso; não deve existir apenas como decoração.
6. **Implemente fallback e redução de movimento.** A aplicação deve continuar funcionando sem a API de animação.
7. **Valide em celular, teclado, rede lenta e sessão expirada.** Uma tela bonita em uma única captura não representa o produto real.

### Perguntas obrigatórias antes de criar uma tela

- Qual ação principal deve ficar evidente?
- Quais dados são reais e quais são demonstrativos?
- A tela precisa persistir alguma informação?
- Como ela aparece em 320 px, 390 px e 430 px de largura?
- O que acontece sem conexão ou com sessão expirada?
- É possível usar tudo por teclado?
- A animação respeita `prefers-reduced-motion`?
- O conteúdo de Libras foi validado por uma pessoa qualificada?

## 3. Estado atual resumido

### Funcional

- frontend React com Vite e Tailwind CSS;
- API Express separada;
- cadastro e login por e-mail/senha no Supabase Auth;
- tokens de sessão em cookies `HttpOnly`;
- restauração de sessão ao abrir a aplicação;
- onboarding com cinco etapas;
- persistência de nível, objetivos e meta diária;
- Home com área “Aprender”;
- tela de trilha do curso;
- aba “Praticar” com desafios e progresso visual;
- navegação inferior flutuante com indicador animado;
- componentes reutilizáveis de logo, ícones, formulários e mascote;
- build de produção e verificação automática da marca.

### Demonstrativo ou incompleto

- desafios, XP, gemas, vidas e sequência usam valores estáticos;
- botões dos desafios exibem aviso, mas ainda não iniciam exercícios reais;
- Ranking, Conquistas e Perfil ainda não possuem telas completas;
- o botão visual de Google não está integrado ao OAuth;
- “Esqueci minha senha” ainda não tem fluxo completo;
- a tela de edição de perfil ainda não existe;
- os vídeos e o PDF estão no projeto, mas ainda não formam um player pedagógico completo;
- não existe suíte automatizada de testes unitários ou de integração;
- o servidor Express ainda não publica o diretório `dist` por conta própria.

### Pendência crítica de banco

No estado atual do workspace, a migration histórica `supabase/migrations/20260910120000_create_profiles.sql` está removida. A versão consultada durante o desenvolvimento criava o perfil inicial, mas ainda não continha as colunas educacionais que `server/routes/profile.js` utiliza:

- `libras_level`;
- `learning_goals`;
- `daily_goal_minutes`;
- `onboarding_completed_at`.

O banco hospedado pode já ter recebido alterações manualmente, mas uma pessoa reconstruindo o projeto não possui hoje uma sequência completa de migrations no worktree. Antes de produção, restaure ou recrie a migration base e versione também a alteração do onboarding. Há um modelo complementar na seção 12.

## 4. Tecnologias e motivos

| Tecnologia | Uso | Motivo |
| --- | --- | --- |
| React 19 | composição das telas | estados e componentes reutilizáveis |
| Vite 8 | desenvolvimento e build | inicialização rápida e proxy simples |
| Tailwind CSS 4 | estilos | implementação visual rápida e responsiva |
| Lucide React | ícones | SVG consistente, leve e acessível |
| Node.js 20.19+ | runtime | requisito do Vite e da API |
| Express 5 | API REST | camada segura entre navegador e Supabase |
| Supabase Auth | autenticação | cadastro, login e renovação de sessão |
| Supabase PostgreSQL | perfis | persistência relacional com RLS |
| Helmet | cabeçalhos HTTP | segurança básica da API |
| express-rate-limit | limitação de tentativas | proteção das rotas de autenticação |
| cookie-parser | cookies de sessão | leitura dos tokens `HttpOnly` |
| ws | transporte WebSocket no Node | compatibilidade do cliente Supabase no servidor |

## 5. Como executar localmente

### Requisitos

- Node.js `20.19.0` ou superior;
- npm compatível;
- projeto Supabase;
- migrations aplicadas no banco.

### Instalação

```bash
npm install
```

### Variáveis de ambiente

Copie `.env.example` para `.env` na raiz e preencha as credenciais do projeto. Exemplo de configuração:

```env
PORT=3001
CLIENT_ORIGIN=http://localhost:5173
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE
NODE_ENV=development
```

Também é aceito `SUPABASE_ANON_KEY` como fallback. Nunca use a chave `service_role` no frontend e nunca coloque segredo em variável com prefixo `VITE_`.

### Inicialização

```bash
npm run dev
```

Serviços esperados:

- frontend: `http://localhost:5173`;
- API: `http://localhost:3001/api`;
- saúde da API: `http://localhost:3001/api/health`;
- status do Supabase: `http://localhost:3001/api/auth/status`.

### Comandos

| Comando | Resultado |
| --- | --- |
| `npm run dev` | inicia API e Vite juntos |
| `npm run dev:client` | inicia apenas o Vite |
| `npm run dev:server` | inicia apenas a API com Nodemon |
| `npm run build` | gera `dist/` |
| `npm run preview` | visualiza o build do Vite |
| `npm start` | inicia apenas o Express |
| `npm run check:brand` | verifica o uso correto da marca |
| `npm run check` | valida a marca e executa o build |

## 6. Arquitetura

```text
Navegador
└─ React + Tailwind
   ├─ App.jsx: fluxo de telas e sessão
   ├─ pages/: composição de páginas
   ├─ components/: peças reutilizáveis
   └─ services/: cliente da API
          │
          │ /api + credentials: include
          ▼
Express
├─ validação de entrada
├─ validação de origem
├─ rate limit
├─ cookies HttpOnly
├─ tratamento central de erros
└─ cliente Supabase sem persistência local
          │
          ▼
Supabase
├─ Auth: usuário, e-mail e senha
└─ PostgreSQL: public.profiles + RLS
```

### Por que o frontend não acessa o Supabase diretamente

O Express centraliza validação, cookies, mensagens de erro e regras de segurança. O navegador não armazena token em `localStorage`. O frontend sempre chama `/api`, e o Vite encaminha essa rota para a porta `3001` durante o desenvolvimento.

### Estado de navegação atual

O projeto ainda não usa React Router. `src/App.jsx` funciona como uma máquina de estados simples:

```text
splash
  └─ boas_vindas
       ├─ login
       └─ cadastro
            └─ onboarding
                 └─ home
                      └─ trilha_curso
```

`navegarPara(destino)` salva o destino, mostra a Splash e, ao final do temporizador, abre a próxima tela.

Essa solução é adequada para o protótipo. Quando existirem links compartilháveis, histórico do navegador e muitas telas, migre para um roteador real.

## 7. Estrutura de arquivos

```text
LUMILIBRAS/
├─ index.html
├─ package.json
├─ vite.config.js
├─ DESIGN.md
├─ README.md
├─ README-2.0.md
├─ README-3.0.md
├─ mascote/                    # PNGs oficiais das poses da Lumi
├─ public/                     # arquivos servidos sem transformação
│  ├─ favicon.svg
│  ├─ CARTILHA - VF.pdf
│  └─ *.webm                   # vídeos de sinais/contextos de saúde
├─ scripts/
│  └─ check-brand.js
├─ server/
│  ├─ index.js                # Express, CORS, Helmet e erros
│  ├─ config/supabase.js
│  ├─ lib/
│  │  ├─ async-handler.js
│  │  ├─ auth-cookies.js
│  │  └─ authenticated-supabase.js
│  └─ routes/
│     ├─ index.js
│     ├─ auth.js
│     └─ profile.js
├─ src/
│  ├─ main.jsx
│  ├─ App.jsx
│  ├─ index.css               # tokens e animações globais
│  ├─ assets/
│  │  ├─ brands/
│  │  └─ componentes/
│  ├─ components/
│  │  ├─ formulario/
│  │  ├─ icons/
│  │  ├─ mascote/
│  │  └─ LogoLumiLibras.jsx
│  ├─ pages/
│  │  ├─ SplashScreen.jsx
│  │  ├─ BoasVindas.jsx
│  │  ├─ Login.jsx
│  │  ├─ Cadastro.jsx
│  │  ├─ Onboarding.jsx
│  │  ├─ Home.jsx
│  │  └─ TrilhaCurso.jsx
│  └─ services/
│     ├─ api.js
│     ├─ authApi.js
│     └─ profileApi.js
└─ supabase/migrations/          # reconstruir/versionar o schema completo
```

### Regra de organização

- arquivo importado pelo React: `src/assets`;
- arquivo acessado por URL direta ou download: `public`;
- tela inteira: `src/pages`;
- peça repetida: `src/components`;
- chamada HTTP: `src/services`;
- regra protegida, autenticação ou banco: `server`;
- mudança de schema: nova migration, nunca alteração manual sem registro.

## 8. Fluxo de sessão e perfil

Ao montar `App.jsx`, a aplicação tenta:

1. `GET /api/auth/session`;
2. `GET /api/profile`;
3. atualizar `usuario` e `perfil`;
4. escolher `home` se `onboardingConcluido` for verdadeiro;
5. escolher `onboarding` caso contrário;
6. manter o fluxo público se a sessão falhar.

### Cadastro

1. O formulário valida nome, e-mail, senha, confirmação e aceite.
2. `POST /api/auth/register` repete a validação no servidor.
3. O Supabase cria o usuário.
4. O trigger `handle_new_user` cria `public.profiles`.
5. Se o Supabase devolver sessão, os cookies são gravados e o onboarding começa.
6. Se a confirmação de e-mail estiver habilitada, a tela informa que o usuário deve confirmar.

### Login

1. `POST /api/auth/login` chama `signInWithPassword`.
2. O servidor grava access e refresh tokens em cookies `HttpOnly`.
3. O frontend carrega o perfil.
4. O usuário vai para Home ou onboarding conforme o banco.

### Renovação

Se o access token não validar, a rota de sessão tenta renovar usando o refresh token. Uma renovação válida substitui os cookies. Uma renovação inválida limpa a sessão.

### Cookies

- `lumilibras_access_token`: curta duração, baseada na sessão;
- `lumilibras_refresh_token`: até 30 dias;
- `HttpOnly` sempre;
- `SameSite=Lax`;
- `Secure` em produção;
- `path=/`.

## 9. Guia de cada página

### 9.1 SplashScreen

Arquivo: `src/pages/SplashScreen.jsx`

Responsabilidades:

- apresentar marca e mascote;
- sinalizar carregamento;
- esperar `2400 ms` por padrão;
- chamar `aoConcluir` sem conhecer a próxima tela.

Elementos:

- logo central;
- ícones decorativos de Libras e educação;
- mascote com flutuação;
- três pontos de carregamento;
- fundo pontilhado com máscara radial.

Não coloque autenticação dentro da Splash. Ela é apresentação e transição; a restauração de sessão pertence a `App.jsx`.

### 9.2 Boas-vindas

Arquivo: `src/pages/BoasVindas.jsx`

Objetivo: explicar o produto em poucos segundos e oferecer três caminhos visuais:

- criar conta;
- entrar;
- continuar com Google.

O Google ainda é somente visual. Não prometa autenticação social enquanto `aoEntrarComGoogle` não estiver conectado ao backend.

### 9.3 Login

Arquivo: `src/pages/Login.jsx`

Estados locais:

- `email`;
- `senha`;
- `erros`;
- `mensagem`;
- `enviando`.

Padrão de formulário:

1. prevenir envio nativo;
2. validar os campos no cliente;
3. limpar mensagem anterior;
4. desabilitar o botão durante a requisição;
5. chamar a função recebida por propriedade;
6. exibir erro retornado pela API;
7. sempre encerrar `enviando` em `finally`.

### 9.4 Cadastro

Arquivo: `src/pages/Cadastro.jsx`

Dados coletados:

- nome;
- e-mail;
- senha;
- confirmação de senha;
- aceite dos Termos e ciência da Política.

Regras atuais:

- nome com pelo menos dois caracteres;
- e-mail em formato plausível;
- senha com pelo menos oito caracteres no frontend e até 128 no backend;
- senhas iguais;
- aceite obrigatório.

Os links legais abrem `README-2.0.md` importado como URL pelo Vite.

### 9.5 Onboarding

Arquivo: `src/pages/Onboarding.jsx`

O onboarding conhece o usuário e salva preferências educacionais.

| Etapa | Conteúdo | Estado |
| --- | --- | --- |
| 1 | introdução | sem dado obrigatório |
| 2 | nível em Libras | `nivel` |
| 3 | objetivos | `objetivos[]` |
| 4 | meta diária | `metaDiaria` |
| 5 | resumo e confirmação | envia os dados |

Valores aceitos pelo contrato atual:

```text
nivel:
  nunca_estudei
  alguns_sinais
  basico
  intermediario

objetivos:
  familia
  trabalho
  escola
  inclusao
  curiosidade
  desenvolvimento_pessoal

metaDiaria:
  5, 10, 15 ou 20
```

A conclusão chama `profileApi.concluirOnboarding`, que envia:

```json
{
  "nivelLibras": "basico",
  "objetivos": ["trabalho", "inclusao"],
  "metaDiaria": 10,
  "concluirOnboarding": true
}
```

O backend grava `onboarding_completed_at`. Em acessos futuros, `App.jsx` detecta esse valor e abre a Home diretamente.

#### Retorno entre etapas

O botão separado de voltar foi removido. Os círculos concluídos na trilha são botões. O usuário pode clicar em qualquer etapa anterior, mas não em etapas futuras.

Isso evita adicionar outra linha de controles e usa a própria representação do progresso como navegação.

#### Edição futura

Depois que o onboarding é confirmado, ele não aparece novamente. A tela de Perfil deverá permitir alterar nível, objetivos e meta diária usando `PATCH /api/profile`. Para testes, pode ser criado um comando explícito “Refazer onboarding”, mas não se deve apagar dados silenciosamente.

### 9.6 Home — Aprender

Arquivo: `src/pages/Home.jsx`

A Home foi limitada a `430 px` para preservar a composição de aplicativo em telas grandes.

Elementos:

- cabeçalho com logo, sequência, gemas e vidas;
- saudação com primeiro nome do perfil;
- card de meta diária;
- progresso do curso atual;
- quatro unidades resumidas;
- botão para abrir toda a trilha;
- fundo verde decorativo;
- navegação inferior flutuante.

Os números de progresso ainda são dados de demonstração. Ao conectar o aprendizado real, remova constantes estáticas e carregue um resumo da API.

### 9.7 Home — Praticar

Também implementada em `src/pages/Home.jsx` e exibida quando `abaAtiva === "praticar"`.

Elementos:

- título “Desafios diários”;
- contador de desafios concluídos;
- três cards com duração, progresso e recompensa;
- desafio relâmpago;
- sequência semanal;
- mesma navegação inferior da Home.

Os dados estão em `DESAFIOS_DIARIOS`. Essa abordagem facilita montar primeiro a interface e depois trocar o array por uma resposta da API.

Arquitetura futura sugerida:

```text
GET /api/practice/today
└─ challenges[]
   ├─ id
   ├─ type
   ├─ title
   ├─ current
   ├─ target
   ├─ durationMinutes
   ├─ rewardType
   ├─ rewardValue
   └─ completedAt
```

As pessoas fazendo sinais usadas como referência visual precisam ter origem e licença registradas. Se forem geradas, guarde prompt, data e revisão. Toda pose que pretende ensinar um sinal real deve ser validada por uma pessoa fluente ou profissional de Libras; uma imagem visualmente plausível pode estar linguisticamente errada.

### 9.8 Trilha do curso

Arquivo: `src/pages/TrilhaCurso.jsx`

Esta tela preserva a versão anterior da Home como trilha vertical. Ela contém:

- cabeçalho azul de indicadores;
- etapas alternadas entre esquerda e direita;
- conexões SVG pontilhadas;
- estados concluído, atual e bloqueado;
- fundo oficial da Home;
- navegação inferior.

No estado atual, apenas a etapa de Saúde responde e exibe aviso de conteúdo futuro.

### 9.9 Ranking, Conquistas e Perfil

Ainda não existem como páginas completas. Enquanto isso, a Home informa que haverá novidades.

Ao implementá-las, evite aumentar indefinidamente `Home.jsx`. Extraia para:

```text
src/pages/home/Aprender.jsx
src/pages/home/Praticar.jsx
src/pages/home/Ranking.jsx
src/pages/home/Conquistas.jsx
src/pages/home/Perfil.jsx
src/components/navegacao/BarraPrincipal.jsx
```

## 10. Componentes reutilizáveis

### LogoLumiLibras

Arquivo: `src/components/LogoLumiLibras.jsx`

Regra imutável de marca:

- `Lumi` em azul;
- `Libras` em verde;
- alterações devem passar por `npm run check:brand`.

### AppIcon

Arquivo: `src/components/icons/AppIcon.jsx`

Centraliza os nomes semânticos usados pelas telas e os converte em ícones Lucide. Para adicionar um ícone:

1. importe o componente de `lucide-react`;
2. registre uma chave em `ICONES`;
3. use a chave pelo significado, não pelo desenho;
4. mantenha `aria-hidden` quando o texto vizinho já explicar a ação.

### Mascote

Arquivo: `src/components/mascote/Mascote.jsx`

Poses disponíveis:

- `assustado`;
- `boas_vindas`;
- `brava`;
- `curiosa`;
- `joia`;
- `otimo`;
- `palmas`;
- `sono`;
- `triste`.

O componente controla tamanho, texto alternativo, prioridade, carregamento e animação. Não importe PNGs do mascote diretamente numa página se o componente puder resolver.

### Formulários

- `CampoSenha.jsx`: campo com controle de visibilidade;
- `MensagemErro.jsx`: mensagem padronizada e acessível;
- `index.js`: ponto único de exportação.

Crie componentes compartilhados quando um padrão aparecer em duas ou mais telas. Não extraia cada `div`; extraia unidades com responsabilidade clara.

## 11. Sistema visual

O arquivo de referência é `DESIGN.md`. Os tokens executáveis ficam em `src/index.css` no bloco `@theme`.

### Cores principais

| Papel | Cor |
| --- | --- |
| azul principal | `#004fac` |
| azul de destaque | `#1267d6` |
| azul claro de foco | `#adc6ff` |
| verde-limão | `#c3f01f` |
| verde escuro | `#516600` |
| superfície | `#f9f9ff` |
| texto principal | `#111c2c` |
| erro | `#ba1a1a` |

### Tipografia

- títulos: Plus Jakarta Sans;
- corpo e controles: Work Sans;
- fallback: Segoe UI e fontes do sistema.

Se as fontes não forem empacotadas ou carregadas externamente, o navegador usará o fallback. Antes do lançamento, decida se as fontes serão hospedadas localmente para estabilidade e privacidade.

### Espaçamento e forma

- grade base de 4 px;
- margem lateral mobile de 16 px;
- cards principais entre 16 e 24 px de raio;
- botões com altura mínima próxima de 48–56 px;
- áreas clicáveis nunca menores que 44 px quando possível;
- sombras rígidas inferiores em ações principais para efeito tátil;
- sombras ambientais suaves em cards.

### Responsividade

- começar em 320 px;
- usar `dvh` para altura mobile;
- respeitar `env(safe-area-inset-top)` e `env(safe-area-inset-bottom)`;
- evitar largura fixa em textos;
- usar `clamp()` quando rótulos precisam caber na navegação;
- verificar 200% de zoom;
- não esconder conteúdo importante atrás da barra fixa inferior.

## 12. Banco de dados

### Modelo lógico esperado

```text
auth.users
└─ id uuid
   └─ public.profiles.id (FK com cascade)
      ├─ display_name
      ├─ terms_accepted_at
      ├─ terms_version
      ├─ privacy_acknowledged_at
      ├─ privacy_version
      ├─ libras_level
      ├─ learning_goals[]
      ├─ daily_goal_minutes
      ├─ onboarding_completed_at
      ├─ created_at
      └─ updated_at
```

### Migration base e complemento recomendados

Primeiro garanta uma migration base que crie `public.profiles`, RLS, policies, trigger de novo usuário e trigger de `updated_at`. O histórico do Git contém uma versão inicial chamada `20260910120000_create_profiles.sql`, mas ela está removida no worktree atual e não cobria todas as preferências educacionais.

Crie um novo arquivo com timestamp posterior ao inicial, por exemplo:

```text
supabase/migrations/20260911130000_add_onboarding_preferences.sql
```

Conteúdo recomendado para revisão antes de aplicar:

```sql
alter table public.profiles
  add column if not exists libras_level text,
  add column if not exists learning_goals text[] not null default '{}',
  add column if not exists daily_goal_minutes integer not null default 10,
  add column if not exists onboarding_completed_at timestamptz;

alter table public.profiles
  add constraint profiles_libras_level_check
  check (
    libras_level is null or libras_level in (
      'nunca_estudei',
      'alguns_sinais',
      'basico',
      'intermediario'
    )
  );

alter table public.profiles
  add constraint profiles_daily_goal_minutes_check
  check (daily_goal_minutes in (5, 10, 15, 20));

alter table public.profiles
  add constraint profiles_learning_goals_check
  check (
    learning_goals <@ array[
      'familia',
      'trabalho',
      'escola',
      'inclusao',
      'curiosidade',
      'desenvolvimento_pessoal'
    ]::text[]
  );

grant update (
  display_name,
  libras_level,
  learning_goals,
  daily_goal_minutes,
  onboarding_completed_at
) on public.profiles to authenticated;
```

Em PostgreSQL, nomes de constraints precisam ser únicos. Se alguma já foi criada manualmente no banco hospedado, adapte a migration em vez de executar cegamente.

### Backfill para usuários antigos

Usuários criados antes do trigger podem existir em `auth.users` sem linha em `profiles`, causando erro `PGRST116` ou `PROFILE_READ_FAILED`.

Antes do backfill, faça backup e revise os metadados:

```sql
insert into public.profiles (id, display_name)
select
  users.id,
  left(coalesce(users.raw_user_meta_data ->> 'display_name', ''), 80)
from auth.users as users
where not exists (
  select 1
  from public.profiles as profiles
  where profiles.id = users.id
);
```

### Versões legais no trigger

A versão histórica da migration inicial gravava a versão de privacidade `2026-09-10-v1`, enquanto a API usa `2026-09-11-v2`. Ao recriar o trigger, leia `terms_version` e `privacy_version` de `raw_user_meta_data` ou use constantes sincronizadas em migration. Não deixe API, documento e banco discordarem.

### RLS

As políticas devem garantir:

- `anon` não lê nem atualiza perfis;
- `authenticated` visualiza somente a própria linha;
- `authenticated` atualiza somente a própria linha;
- nenhuma policy permite trocar o `id` do perfil;
- colunas liberadas por `grant update` são mínimas.

RLS não substitui validação no Express. O backend valida para dar resposta clara; o banco valida para impedir inconsistência mesmo que outra camada falhe.

## 13. Contrato da API

### Rotas gerais

| Método | Rota | Função |
| --- | --- | --- |
| `GET` | `/api` | nome e versão da API |
| `GET` | `/api/health` | saúde do Express |

### Autenticação

| Método | Rota | Função |
| --- | --- | --- |
| `GET` | `/api/auth/status` | informa configuração e versões legais |
| `POST` | `/api/auth/register` | cria conta |
| `POST` | `/api/auth/login` | inicia sessão |
| `GET` | `/api/auth/session` | valida ou renova a sessão |
| `POST` | `/api/auth/refresh` | renova explicitamente |
| `POST` | `/api/auth/logout` | encerra a sessão |

### Perfil

| Método | Rota | Função |
| --- | --- | --- |
| `GET` | `/api/profile` | retorna o perfil autenticado |
| `PATCH` | `/api/profile` | atualiza campos enviados |

### Formato de erro

```json
{
  "error": "Mensagem segura para o usuário.",
  "code": "INVALID_DAILY_GOAL"
}
```

`src/services/api.js` converte respostas inválidas em `ApiError` com `status` e `code`. A interface deve preferir `code` para decisões e `message` para apresentação.

### Regra para novas rotas

1. valide tipos, tamanho e domínio dos valores;
2. use `asyncHandler`;
3. não retorne detalhes internos do Supabase;
4. use o cliente autenticado para dados do usuário;
5. mantenha RLS habilitada;
6. retorne códigos estáveis;
7. documente a rota aqui;
8. adicione testes.

## 14. Animações e movimento

As animações do onboarding e da navegação foram adaptadas da vitrine open source do Não Codei:

- https://naocodei.com/free-code/

Registre a origem quando adaptar outro efeito.

### 14.1 Splash

- `splash-pular`: pontos de carregamento;
- `splash-flutuar`: ícones decorativos;
- `mascote-flutuar`: deslocamento vertical leve.

Use tempos diferentes para evitar que todos os elementos pareçam mecanicamente sincronizados.

### 14.2 Trilha do onboarding

Combina três técnicas:

1. SVG com curva fixa;
2. `clipPath` cuja largura revela o trecho concluído;
3. interpolação por `requestAnimationFrame`.

Os pontos são normalizados em porcentagens:

```js
[
  { x: 12, y: 12 },
  { x: 31, y: 12 },
  { x: 50, y: 12 },
  { x: 69, y: 12 },
  { x: 88, y: 12 },
]
```

O marcador ativo usa a mesma coordenada horizontal calculada pelos extremos `12` e `88`. Isso evita o erro anterior de usar `getPointAtLength()` em coordenada SVG e aplicar o resultado como porcentagem CSS, que produzia desalinhamento progressivo.

### 14.3 Transição entre etapas

Quando disponível, `document.startViewTransition()` fotografa o estado anterior e o próximo. `flushSync` garante que a atualização React aconteça dentro da transição. Navegadores sem suporte recebem troca direta.

### 14.4 Navegação inferior da Home

O fundo azul ativo não pertence a cada botão. Ele é uma cápsula absoluta independente que se move até o botão selecionado.

Passos:

1. guardar referências do contêiner e dos botões;
2. medir `offsetLeft` e `offsetWidth` do destino;
3. calcular força com a diferença entre destino e posição;
4. aplicar amortecimento à velocidade;
5. atualizar `translate3d` por quadro;
6. alongar levemente a cápsula com `scaleX` durante o movimento;
7. interromper o laço quando posição e velocidade forem quase zero;
8. usar `ResizeObserver` para realinhar após mudança de largura.

Fórmula atual:

```js
const forca = (alvo - posicao) * 0.18;
velocidade = (velocidade + forca) * 0.72;
posicao += velocidade;
```

Esse modelo veio do efeito “Botão elástico”. Não substitua por um `transition: all` sem avaliar o resultado: a cápsula precisa manter continuidade mesmo quando o usuário troca de direção antes de a animação terminar.

### 14.5 Redução de movimento

O CSS possui `@media (prefers-reduced-motion: reduce)`. O JavaScript também verifica essa preferência antes das animações mais elaboradas.

Em modo reduzido:

- não use pulos, confetes ou deslizamentos;
- posicione imediatamente o indicador;
- preserve toda a funcionalidade;
- não esconda feedback importante junto com a animação.

## 15. Onde procurar elementos e referências

### Ícones

Fonte atual: Lucide React.

- procure primeiro por significado: `target`, `school`, `heart`, `trophy`;
- registre em `AppIcon.jsx` quando o ícone for recorrente;
- não misture cinco bibliotecas com espessuras diferentes;
- ícones corporativos, como Google, devem vir de fonte oficial e ter origem documentada.

### Animações

Fonte usada: Não Codei.

Processo recomendado:

1. escolha o efeito pelo problema de comunicação;
2. leia JavaScript e CSS do exemplo;
3. extraia somente a técnica;
4. adapte cores, dimensões e estado ao componente React;
5. cancele `requestAnimationFrame` no cleanup;
6. adicione fallback;
7. respeite movimento reduzido;
8. registre a origem em comentário.

### Mockups e referências visuais

Capturas na raiz são referências de trabalho, não ativos finais. Antes de usar uma imagem da internet:

- confirme licença;
- salve a URL e o autor;
- confirme permissão para uso comercial, se aplicável;
- evite copiar marca ou interface de concorrente;
- prefira reconstruir a hierarquia visual com a identidade LumiLibras.

### Imagens geradas

Para pessoas ou ilustrações geradas:

- peça fundo transparente real, não um xadrez desenhado;
- verifique tecnicamente se o PNG possui canal alfa;
- preserve o prompt e a data;
- reduza a resolução para o tamanho de uso;
- use `loading="lazy"` fora da primeira dobra;
- valide mãos e sinais de Libras;
- nunca trate geração visual como fonte linguística.

### Conteúdo educacional

O PDF e os vídeos de saúde ficam em `public`. Ao criar lições:

1. inventarie cada termo e vídeo;
2. associe título, categoria, dificuldade e duração;
3. valide a correspondência entre texto e sinal;
4. forneça legenda e descrição quando possível;
5. não dependa apenas de cor ou áudio;
6. registre autoria e licença do material.

## 16. Método de implementação de uma nova funcionalidade

Exemplo: construir a tela Perfil.

### Passo 1 — definir o resultado

O usuário deve visualizar e editar nome, nível, objetivos e meta diária.

### Passo 2 — conferir o contrato existente

`PATCH /api/profile` já aceita esses campos. Não crie outro nome como `dailyMinutes` apenas no frontend.

### Passo 3 — desenhar os estados

- carregando;
- dados carregados;
- edição limpa;
- edição alterada;
- salvando;
- salvo;
- erro de validação;
- erro de sessão.

### Passo 4 — separar componentes

```text
Perfil.jsx
├─ CabecalhoPerfil
├─ CampoNome
├─ SeletorNivel
├─ SeletorObjetivos
├─ SeletorMeta
└─ BotaoSalvar
```

Reutilize padrões do onboarding em vez de duplicar arrays e estilos. Um passo futuro saudável é mover `NIVEIS`, `OBJETIVOS` e `METAS` para um módulo compartilhado.

### Passo 5 — implementar sem movimento

Conclua dados, validação, foco, mensagens e responsividade.

### Passo 6 — adicionar movimento útil

Anime confirmação ou mudança de seleção, sem atrasar o salvamento.

### Passo 7 — validar

- teclado;
- leitor de tela;
- 320 px;
- rede lenta;
- resposta 401;
- resposta 422;
- build;
- persistência após recarregar.

## 17. Resolução de problemas já encontrados

### Scripts bloqueados por Content Security Policy

Sintomas:

```text
script-src 'none'
@vite/client bloqueado
src/main.jsx bloqueado
```

Diagnóstico: a página estava sendo aberta dentro de um simulador/iframe que aplicava CSP própria. A resposta direta do Vite não continha essa política.

Solução:

- abrir `http://localhost:5173` diretamente;
- não depurar o Vite dentro do iframe restritivo;
- verificar cabeçalhos da resposta antes de alterar Helmet ou o HTML.

Lição: uma mensagem no console pode vir do contêiner que hospeda a aplicação, não da aplicação.

### `favicon.ico` 404

O projeto usa `public/favicon.svg`. Garanta que `index.html` aponte explicitamente para `/favicon.svg`. O erro de `favicon.ico` não deve ser confundido com falha do React.

### `GET /api/profile` retornando 500

Causas prováveis:

- usuário antigo sem linha em `profiles`;
- migration de onboarding ausente;
- grants de update incompletos;
- RLS não aplicada corretamente.

Diagnóstico:

1. observar o código e os detalhes registrados pelo servidor;
2. procurar `PGRST116`, coluna inexistente ou permissão negada;
3. conferir a linha do usuário no SQL Editor;
4. comparar o schema remoto com `supabase/migrations`;
5. aplicar migration/backfill controlado.

### Dependência `ws` ausente

O SDK Supabase inicializa recursos que esperam WebSocket. Node 20 não oferece o mesmo transporte global esperado nesse contexto. O projeto instala `ws` e o injeta em `server/config/supabase.js`.

### Marcador do onboarding fora da linha

Problema: o resultado de `getPointAtLength()` foi tratado como porcentagem, criando erro de posição nas etapas seguintes.

Solução: usar coordenadas normalizadas fixas para os cinco marcos e interpolar entre `12%` e `88%`.

Lição: não misture coordenadas de `viewBox`, pixels renderizados e porcentagens CSS sem conversão explícita.

### Progresso SVG aparecendo em trechos alternados

Problema: `stroke-dasharray`, `pathLength` e comprimento real da curva interagiram de forma inesperada.

Solução: manter uma linha inteira e revelar apenas a região concluída usando um `clipPath` retangular.

Lição: quando o efeito desejado é uma janela de revelação, clipping costuma ser mais previsível que recalcular traços.

### Indicador da navegação mudando de forma seca

Problema: cada botão adicionava e removia o próprio fundo azul instantaneamente.

Solução: criar uma cápsula única, medir o destino e movê-la com mola e amortecimento.

Lição: continuidade visual exige que o mesmo objeto atravesse os estados; trocar dois fundos não comunica deslocamento.

### Checklist geral de diagnóstico

```text
1. Reproduzir com passos exatos.
2. Identificar se o erro é visual, estado, rede, API ou banco.
3. Ler o primeiro erro real, não apenas os erros em cascata.
4. Conferir Network e resposta JSON.
5. Conferir terminal do Express.
6. Comparar contrato enviado e contrato validado.
7. Comparar schema local e remoto.
8. Criar correção mínima.
9. Validar o cenário original e regressões próximas.
10. Registrar a causa neste documento se puder se repetir.
```

## 18. Acessibilidade

Requisitos mínimos para toda nova tela:

- HTML semântico (`main`, `nav`, `section`, `button`, `form`);
- títulos em ordem lógica;
- `aria-label` em ações que só têm ícone;
- `aria-current="page"` na aba ativa;
- `role="status"` para avisos não bloqueantes;
- `role="progressbar"` com valores;
- `role="radio"` e `aria-checked` em seleções exclusivas;
- `aria-pressed` em seleções múltiplas;
- foco visível;
- contraste suficiente;
- alvos de toque adequados;
- alternativa textual para imagens informativas;
- imagem decorativa com `alt=""`;
- suporte a movimento reduzido;
- conteúdo utilizável sem hover.

Libras é visual, mas acessibilidade não se resume a Libras. Textos, legendas, contraste, foco e navegação também são necessários.

## 19. Segurança e privacidade

### Regras técnicas

- não guardar tokens em `localStorage`;
- não enviar senha para logs;
- não retornar erro bruto do Supabase ao usuário;
- validar no frontend, backend e banco;
- usar HTTPS em produção;
- configurar `CLIENT_ORIGIN` exatamente;
- manter `Helmet`;
- limitar tentativas de autenticação;
- manter payload limitado;
- revisar dependências;
- manter RLS ligada;
- não usar `service_role` para requisições comuns de usuário.

### Regra de produto

Toda nova coleta exige atualização conjunta de:

1. schema;
2. API;
3. interface;
4. inventário de dados;
5. Política de Privacidade;
6. versão do documento legal;
7. registro de aceite quando necessário.

## 20. Testes

### Validação automática disponível

```bash
npm run check
```

Atualmente isso valida marca e build. Ainda não substitui testes de comportamento.

### Smoke test manual

1. abrir `/api/health`;
2. abrir `/api/auth/status`;
3. criar um usuário novo;
4. confirmar o e-mail, se exigido;
5. entrar;
6. preencher o onboarding;
7. voltar por um círculo concluído;
8. avançar e confirmar;
9. recarregar e confirmar abertura da Home;
10. abrir a trilha;
11. alternar Aprender/Praticar rapidamente;
12. confirmar que a cápsula azul acompanha;
13. testar cards da Prática;
14. sair quando o logout for exposto na interface;
15. testar sessão expirada.

### Matriz visual

| Cenário | Conferir |
| --- | --- |
| 320 × 568 | textos, botões e rolagem |
| 390 × 844 | composição mobile principal |
| 430 × 932 | limite visual da Home |
| tablet | centralização e largura máxima |
| desktop | experiência em coluna sem esticar |
| zoom 200% | reflow e ausência de cortes |
| dark mode do sistema | aplicação continua legível mesmo sem tema escuro próprio |
| movimento reduzido | nenhum efeito essencial desaparece |

### Próxima infraestrutura de testes

- Vitest + Testing Library para componentes e serviços;
- Supertest para Express;
- Playwright para cadastro, login, onboarding e navegação;
- projeto Supabase separado para CI;
- testes de migration em banco descartável.

## 21. Deploy

Existem duas opções.

### Frontend e API separados

- publicar `dist/` em hospedagem estática;
- publicar `server/` em serviço Node;
- configurar proxy/domínio para `/api`;
- definir CORS e `CLIENT_ORIGIN`;
- garantir cookies compatíveis com o domínio escolhido.

### Express servindo o frontend

Adicionar ao servidor, depois do build e antes do 404:

```js
app.use(express.static("dist"));
app.get("*", (_request, response) => {
  response.sendFile(path.resolve("dist/index.html"));
});
```

Revise a sintaxe de rota compatível com Express 5 e não deixe o fallback do frontend interceptar `/api`.

### Checklist de produção

- `NODE_ENV=production`;
- HTTPS;
- cookies `Secure`;
- domínio permitido correto;
- Supabase URL e chave publicável;
- migrations versionadas e aplicadas;
- confirmação de e-mail definida;
- SMTP configurado;
- URLs de redirecionamento configuradas;
- documentos legais preenchidos e revisados;
- logs sem dados sensíveis;
- monitoramento de erros;
- backup e retenção definidos;
- testes executados.

## 22. Roadmap recomendado

### Prioridade alta

1. versionar a migration das preferências do onboarding;
2. corrigir as versões legais gravadas pelo trigger;
3. criar Perfil com edição dos dados;
4. expor logout;
5. criar player de lição com os vídeos;
6. validar conteúdo de Libras com especialista;
7. adicionar testes de integração.

### Prioridade média

1. persistir XP, vidas, gemas, sequência e desafios;
2. implementar Ranking;
3. implementar Conquistas;
4. integrar Google OAuth;
5. implementar recuperação de senha;
6. adicionar notificações e feedback de conclusão;
7. extrair a navegação para componente compartilhado.

### Melhoria estrutural

1. adotar React Router;
2. dividir `Home.jsx` por abas;
3. mover catálogos de nível/objetivo/meta para módulo compartilhado;
4. criar camada de hooks para sessão e perfil;
5. adicionar tipos com TypeScript ou validação de schema compartilhada;
6. criar `.env.example`;
7. definir estratégia única de hospedagem.

## 23. Definição de pronto

Uma funcionalidade só está concluída quando:

- resolve o problema definido;
- usa dados reais ou está claramente identificada como protótipo;
- possui estados de carregamento, vazio, sucesso e erro;
- valida entrada nas camadas necessárias;
- persiste corretamente quando aplicável;
- respeita RLS e sessão;
- funciona em mobile;
- funciona por teclado;
- respeita movimento reduzido;
- possui origem/licença dos ativos;
- foi revisada quanto à exatidão de Libras;
- passa em `npm run check`;
- não introduz erro no console;
- está documentada.

## 24. Checklist de entrega para outra pessoa

- [ ] Ler `README-3.0.md`.
- [ ] Ler `DESIGN.md`.
- [ ] Ler `README-2.0.md` e preencher pendências legais.
- [ ] Instalar Node e dependências.
- [ ] Criar `.env` sem commitar segredos.
- [ ] Conferir o projeto Supabase.
- [ ] Comparar migrations com o schema remoto.
- [ ] Restaurar ou recriar a migration base de perfis.
- [ ] Aplicar a migration complementar do onboarding.
- [ ] Executar `npm run dev`.
- [ ] Testar cadastro, login e onboarding.
- [ ] Executar `npm run check`.
- [ ] Revisar status do Git antes de alterar arquivos do usuário.
- [ ] Não apagar capturas ou assets sem confirmar sua origem.
- [ ] Registrar novas decisões e pendências neste arquivo.

## 25. Regra final de continuidade

Não comece pela animação ou pela captura bonita. Comece pelo fluxo, estado e contrato de dados. Depois construa a hierarquia visual, valide a interação e só então adicione movimento.

Na LumiLibras, cada efeito deve ajudar o usuário a perceber uma destas coisas:

- onde ele está;
- para onde foi;
- o que concluiu;
- o que pode fazer agora;
- qual foi o resultado da ação.

Se o efeito não responde a nenhuma dessas perguntas, provavelmente ele pode ser removido.
