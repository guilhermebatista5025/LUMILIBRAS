# Banco do LumiLibras

As migrations desta pasta recriam o banco usado pela API. Execute os arquivos em
ordem alfabética (o prefixo `YYYYMMDDHHMMSS` já define a ordem) usando o Supabase
CLI ou o SQL Editor do projeto:

```powershell
supabase db push
```

Se o projeto ainda não estiver vinculado ao CLI, abra o SQL Editor, cole os
arquivos na mesma ordem e execute cada um uma única vez. Não execute novamente
migrations já aplicadas em um banco que tenha dados.

O conjunto cria:

- `public.profiles`, onboarding e trigger de novos usuários;
- progresso, fases, XP, corações, conquistas e catálogo do jogo em `lumi_game`;
- loja, moedas, skins, compras idempotentes e habilidades;
- preferências de notificação, convites de amizade e ranking social;
- bucket privado `lumilibras-avatars` com políticas para o próprio usuário.

O cadastro e o login continuam usando `auth.users` do Supabase Auth. A API usa
apenas `SUPABASE_URL` e `SUPABASE_PUBLISHABLE_KEY`/`SUPABASE_ANON_KEY` do `.env`;
nenhuma chave é armazenada nas migrations.
