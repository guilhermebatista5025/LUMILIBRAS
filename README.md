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
