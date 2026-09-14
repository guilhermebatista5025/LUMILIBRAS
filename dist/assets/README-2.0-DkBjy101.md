# LumiLibras — arquitetura, privacidade e termos

Versão do documento: `2026-09-11-v2`
Última atualização: 11 de setembro de 2026
Status: **minuta interna — não publicar antes de preencher os campos pendentes e obter revisão jurídica**

Este arquivo acompanha a evolução técnica e jurídica da LumiLibras. Sempre que uma nova coleta de dados, integração ou funcionalidade for incluída, o inventário, a Política de Privacidade e os Termos de Uso deverão ser revisados em conjunto.

## Pendências obrigatórias antes da publicação

- `[PREENCHER]` Nome completo ou razão social do controlador.
- `[PREENCHER]` CPF/CNPJ, quando aplicável.
- `[PREENCHER]` Endereço do controlador.
- `[PREENCHER]` E-mail público para privacidade e exercício de direitos.
- `[DECIDIR]` Público etário. A versão atual não deve aceitar cadastro de crianças ou adolescentes até existir um fluxo adequado.
- `[DEFINIR]` Prazos operacionais de exclusão, retenção de registros e backups.
- `[CONFIRMAR]` Região do projeto Supabase e condições de transferência internacional.
- `[CONFIGURAR]` URLs, domínio, SMTP e confirmação de e-mail do Supabase.
- `[REVISAR]` Validação final jurídica brasileira antes do lançamento.

## 1. Arquitetura de autenticação

```text
React
  │ requisições /api com credentials: include
  ▼
Express
  ├─ validação de entrada
  ├─ rate limit
  ├─ proteção de origem
  └─ cookies HttpOnly
       │
       ▼
Supabase Auth + PostgreSQL/RLS
```

O frontend não recebe a chave do Supabase e não armazena tokens em `localStorage`. O Express usa a chave publicável para chamar o Supabase Auth e grava os tokens de sessão em cookies `HttpOnly`, `SameSite=Lax` e `Secure` em produção.

### Rotas disponíveis

| Método | Rota | Finalidade |
| --- | --- | --- |
| `GET` | `/api/auth/status` | Informa se o Supabase está configurado, sem revelar chaves |
| `POST` | `/api/auth/register` | Cria conta com nome, e-mail, senha e aceite dos termos |
| `POST` | `/api/auth/login` | Autentica por e-mail e senha |
| `GET` | `/api/auth/session` | Valida e retorna o usuário da sessão |
| `POST` | `/api/auth/refresh` | Renova a sessão usando o refresh token |
| `POST` | `/api/auth/logout` | Encerra a sessão e remove os cookies |
| `GET` | `/api/profile` | Retorna o perfil e as preferências do usuário autenticado |
| `PATCH` | `/api/profile` | Atualiza nome ou preferências e conclui o onboarding |

### Configuração do Supabase

1. Crie ou selecione um projeto no Supabase.
2. No SQL Editor, execute, em ordem, os arquivos da pasta `supabase/migrations`.
3. Em Authentication, mantenha o provedor de e-mail/senha habilitado.
4. Defina se a confirmação de e-mail será obrigatória. Em projetos hospedados, ela normalmente vem habilitada.
5. Copie `.env.example` para `.env` e preencha:

```env
SUPABASE_URL=https://SEU-PROJETO.supabase.co
SUPABASE_PUBLISHABLE_KEY=sb_publishable_SUA_CHAVE
```

6. Nunca coloque `service_role` ou outro segredo em variáveis prefixadas por `VITE_`.
7. Reinicie `npm run dev` e confira `GET /api/auth/status`.

### Dados persistidos nesta versão

| Dado | Local | Motivo |
| --- | --- | --- |
| Nome de exibição | `public.profiles` | Personalizar a conta |
| E-mail | Supabase Auth | Identificação, login e confirmação da conta |
| Senha | Supabase Auth | Autenticação; não é gravada em `public.profiles` nem em logs da aplicação |
| Data e versão dos Termos | `public.profiles` | Evidenciar o aceite contratual |
| Data e versão da Política | `public.profiles` | Evidenciar ciência do aviso de privacidade |
| Nível informado de Libras | `public.profiles` | Adequar a dificuldade inicial das lições |
| Objetivos de aprendizado | `public.profiles` | Personalizar conteúdos e recomendações |
| Meta diária em minutos | `public.profiles` | Configurar a rotina de estudo escolhida pelo usuário |
| Conclusão do onboarding | `public.profiles` | Evitar repetir a configuração em novos acessos |
| Tokens de sessão | Cookies `HttpOnly` | Manter a sessão autenticada |
| Endereço IP | Memória temporária do rate limiter e registros técnicos do provedor | Prevenir abuso e proteger a autenticação |

## 2. Política de Privacidade

### 2.1 Identificação do controlador

A LumiLibras é disponibilizada por **[PREENCHER: nome completo ou razão social]**, inscrito(a) no **[PREENCHER: CPF/CNPJ, se aplicável]**, com endereço em **[PREENCHER: endereço]**, doravante denominado “Controlador”.

Contato de privacidade: **[PREENCHER: e-mail]**.  
Encarregado ou canal responsável: **[PREENCHER ou indicar a dispensa aplicável]**.

### 2.2 Escopo

Esta Política explica como a LumiLibras trata dados pessoais durante a criação e o uso inicial de uma conta. Ela se aplica ao site, à aplicação web e à API da LumiLibras. Funcionalidades futuras deverão ser adicionadas a esta Política antes de começarem a coletar dados.

### 2.3 Dados pessoais tratados

Nesta versão, tratamos:

- nome de exibição informado no cadastro;
- endereço de e-mail;
- credencial de senha, recebida transitoriamente pela API e administrada pelo Supabase Auth;
- data e versão do aceite dos Termos de Uso;
- data e versão da ciência desta Política;
- nível de conhecimento em Libras, objetivos de aprendizado e meta diária informados no onboarding;
- data de conclusão da configuração inicial do perfil;
- tokens e cookies estritamente necessários à autenticação;
- dados técnicos mínimos de segurança, como endereço IP, horário e resultado de tentativas de autenticação, conforme os recursos configurados na aplicação e no provedor.

Não solicitamos nesta etapa dados pessoais sensíveis, contatos, localização precisa, câmera, microfone, biometria, dados de saúde ou dados de pagamento.

### 2.4 Finalidades e bases legais

| Tratamento | Finalidade | Base legal inicialmente adotada |
| --- | --- | --- |
| Nome, e-mail e conta | Criar, identificar e administrar a conta | Execução de contrato e procedimentos preliminares, art. 7º, V, da LGPD |
| Senha e sessão | Autenticar o usuário e impedir acesso indevido | Execução de contrato e proteção da conta |
| Registro de aceite | Demonstrar a relação contratual e atender solicitações ou disputas | Execução de contrato e exercício regular de direitos |
| Preferências do onboarding | Personalizar a jornada, a dificuldade e a rotina de estudo | Execução de contrato, conforme escolhas do usuário |
| IP e eventos de segurança | Prevenir fraude, abuso e incidentes | Legítimo interesse, sujeito a avaliação documentada e minimização |
| Obrigações legais | Cumprir ordem válida ou dever regulatório | Cumprimento de obrigação legal ou regulatória |

O aceite dos Termos não é apresentado como autorização genérica para qualquer uso de dados. Caso uma funcionalidade futura dependa de consentimento, ela deverá apresentar finalidade específica, opção destacada e mecanismo de revogação.

### 2.5 Como usamos os dados

Usamos os dados somente para criar e manter a conta, autenticar acessos, responder solicitações do titular, proteger o serviço e cumprir obrigações aplicáveis. Não vendemos dados pessoais. Nesta versão, não usamos os dados para publicidade comportamental, perfilamento comercial ou decisões automatizadas que produzam efeitos relevantes.

### 2.6 Compartilhamento e operadores

O Supabase é utilizado como provedor de autenticação, banco de dados e infraestrutura associada. Ele processa dados em nome do Controlador conforme a configuração do projeto e seus documentos contratuais. Outros fornecedores de hospedagem, e-mail transacional ou monitoramento somente poderão ser incluídos depois de registrados nesta Política.

O login com Google aparece visualmente nas telas, mas **não está habilitado nesta versão**. Antes de habilitá-lo, esta Política deverá informar os dados recebidos, as finalidades e os documentos aplicáveis do Google.

Poderemos compartilhar dados quando houver obrigação legal, ordem de autoridade competente ou necessidade de exercício regular de direitos, sempre dentro dos limites aplicáveis.

### 2.7 Transferência internacional

O Supabase e seus suboperadores podem envolver tratamento fora do Brasil, conforme a região escolhida e a infraestrutura contratada. Antes da produção, o Controlador deverá registrar a região efetiva do projeto, analisar o mecanismo de transferência internacional aplicável e manter os documentos do fornecedor.

Região configurada: **[PREENCHER]**.  
Mecanismo e salvaguardas: **[PREENCHER após análise contratual]**.

### 2.8 Cookies e sessão

Usamos apenas cookies necessários à autenticação nesta etapa:

- `lumilibras_access_token`: cookie `HttpOnly` de curta duração, alinhado ao prazo do token de acesso;
- `lumilibras_refresh_token`: cookie `HttpOnly` com duração máxima atual de 30 dias para renovação da sessão.

Os cookies usam `SameSite=Lax`; em produção, usam também `Secure` e dependem de HTTPS. A saída da conta remove os cookies. Não há cookies publicitários nesta versão.

### 2.9 Retenção e eliminação

Os dados da conta são mantidos enquanto ela estiver ativa e forem necessários às finalidades informadas. Após solicitação válida de exclusão, os dados deverão ser eliminados ou anonimizados, ressalvadas as hipóteses legais de conservação.

Antes da publicação, o Controlador deve preencher e implementar:

- prazo para concluir a exclusão operacional: **[DEFINIR]**;
- prazo de retenção de registros de segurança: **[DEFINIR]**;
- prazo de expurgo de backups do plano Supabase utilizado: **[CONFIRMAR]**;
- prazo de conservação do registro de aceite para exercício regular de direitos: **[DEFINIR COM REVISÃO JURÍDICA]**.

### 2.10 Segurança

Adotamos, nesta implementação inicial:

- autenticação gerenciada pelo Supabase Auth;
- tokens em cookies inacessíveis ao JavaScript;
- HTTPS e cookies `Secure` obrigatórios em produção;
- limitação de tentativas nas rotas de autenticação;
- validação de origem em operações de escrita;
- validação de entrada no frontend e no backend;
- Row Level Security na tabela de perfis;
- acesso do usuário limitado ao próprio perfil;
- ausência de senha em tabelas públicas e logs da aplicação;
- separação entre configuração pública e segredos de servidor.

Nenhum sistema é absolutamente seguro. Incidentes com risco ou dano relevante serão avaliados e comunicados conforme a LGPD e a regulamentação da ANPD.

### 2.11 Direitos do titular

Nos termos da LGPD, o titular pode solicitar, conforme aplicável:

- confirmação da existência de tratamento;
- acesso aos dados;
- correção de dados incompletos, inexatos ou desatualizados;
- anonimização, bloqueio ou eliminação de dados desnecessários, excessivos ou tratados irregularmente;
- portabilidade, quando regulamentada e aplicável;
- informação sobre compartilhamentos;
- eliminação de dados tratados com consentimento, observadas as exceções legais;
- revogação de consentimento, quando essa for a base utilizada;
- oposição a tratamento realizado em desconformidade com a lei;
- petição perante a ANPD e órgãos de defesa do consumidor.

As solicitações deverão ser enviadas para **[PREENCHER: e-mail de privacidade]**. Poderemos solicitar informações proporcionais para confirmar a identidade do requerente. O atendimento será gratuito e observará os prazos legais e regulamentares.

### 2.12 Crianças e adolescentes

A definição do público etário ainda está pendente. Até que sejam implementados mecanismos adequados ao melhor interesse, linguagem acessível, minimização e, quando aplicável, verificação do responsável legal, o cadastro não deverá ser oferecido a crianças ou adolescentes.

Se a LumiLibras for destinada a esse público, esta seção, o formulário, o banco, os Termos e os fluxos de consentimento do responsável deverão ser revisados antes do lançamento.

### 2.13 Alterações desta Política

Mudanças relevantes serão comunicadas de forma clara. Quando a alteração exigir novo consentimento ou aceite, a aplicação deverá solicitar nova manifestação e registrar a versão correspondente. O histórico de versões deverá permanecer neste arquivo.

### 2.14 Contato e reclamações

Dúvidas e solicitações: **[PREENCHER: e-mail]**. O titular também pode apresentar reclamação à Autoridade Nacional de Proteção de Dados ou aos órgãos de defesa do consumidor, conforme aplicável.

## 3. Termos de Uso

### 3.1 Aceitação

Ao criar uma conta, o usuário declara que leu e aceita estes Termos de Uso, versão `2026-09-10-v1`, e declara ciência da Política de Privacidade correspondente. Caso não concorde, não deverá criar nem utilizar uma conta.

### 3.2 Prestador do serviço

O serviço LumiLibras é prestado por **[PREENCHER: nome completo ou razão social, CPF/CNPJ e endereço]**. Contato: **[PREENCHER]**.

### 3.3 Objeto

A LumiLibras é uma plataforma educacional voltada ao aprendizado e à prática de Língua Brasileira de Sinais. Funcionalidades, conteúdos e níveis poderão evoluir ao longo do desenvolvimento.

A plataforma é um recurso complementar de aprendizagem. Salvo informação expressa em contrário, não emite certificação oficial e não substitui formação profissional, orientação pedagógica individual ou serviços de tradução e interpretação.

### 3.4 Elegibilidade

Enquanto não houver fluxo específico para menores, somente pessoas com 18 anos ou mais devem criar conta. Se o produto for disponibilizado a crianças ou adolescentes, estes Termos serão atualizados e os mecanismos legais e técnicos necessários serão implementados previamente.

### 3.5 Conta e credenciais

O usuário deve fornecer dados verdadeiros, manter o e-mail atualizado, proteger sua senha e comunicar suspeitas de acesso indevido. A conta é pessoal e não deve ser compartilhada. O usuário responde pelas atividades realizadas em sua conta na medida permitida pela legislação.

Podemos solicitar confirmação de e-mail e medidas adicionais de segurança. Não solicitaremos a senha por e-mail, mensagem ou atendimento.

### 3.6 Uso permitido

O usuário concorda em não:

- utilizar a plataforma para atividade ilícita ou que viole direitos de terceiros;
- tentar acessar contas, dados, APIs ou áreas sem autorização;
- explorar vulnerabilidades, contornar limites ou interferir no funcionamento do serviço;
- usar automação abusiva, realizar engenharia reversa proibida por lei ou distribuir código malicioso;
- copiar, revender ou explorar comercialmente conteúdo protegido sem autorização;
- fornecer informação falsa para burlar requisitos etários ou de segurança.

Testes de segurança somente poderão ocorrer com autorização prévia e escopo definido.

### 3.7 Conteúdo e propriedade intelectual

A marca LumiLibras, o mascote, a interface, o código, os textos, as ilustrações e os materiais educacionais são protegidos pela legislação aplicável e pertencem aos respectivos titulares. O acesso à plataforma concede uma licença limitada, pessoal, revogável, não exclusiva e intransferível para uso educacional conforme estes Termos.

Materiais de terceiros permanecem sujeitos às licenças e regras de seus titulares. Nenhuma disposição transfere propriedade intelectual ao usuário.

### 3.8 Serviços de terceiros

A plataforma utiliza Supabase para autenticação e infraestrutura de dados. Serviços futuros, como autenticação Google, e-mail ou pagamentos, poderão ter termos próprios e somente serão ativados após atualização da documentação aplicável.

### 3.9 Disponibilidade e alterações

Buscamos manter a plataforma disponível, mas interrupções podem ocorrer por manutenção, segurança, falhas de fornecedores ou eventos fora de controle razoável. Funcionalidades podem ser ajustadas, substituídas ou removidas, respeitados os direitos do consumidor e comunicações necessárias.

### 3.10 Suspensão e encerramento

O usuário poderá solicitar o encerramento da conta pelo canal **[PREENCHER]**. A LumiLibras poderá limitar ou suspender acesso diante de risco de segurança, fraude, uso ilícito ou violação relevante destes Termos, preferencialmente com informação ao usuário quando isso não comprometer investigações ou medidas de proteção.

O encerramento observará a Política de Privacidade e as hipóteses legais de retenção.

### 3.11 Responsabilidades

Cada parte responde por seus atos conforme a legislação aplicável. A LumiLibras não exclui nem limita responsabilidades que não possam ser afastadas por lei, inclusive direitos previstos no Código de Defesa do Consumidor quando aplicável.

Resultados educacionais variam conforme prática, contexto e dedicação. A plataforma não garante fluência, contratação profissional ou resultado específico.

### 3.12 Privacidade

O tratamento de dados pessoais é descrito na Política de Privacidade deste documento. Em caso de conflito sobre proteção de dados, prevalecerá a interpretação mais compatível com a LGPD e com os direitos do titular.

### 3.13 Alterações dos Termos

Alterações materiais serão informadas de modo destacado. Quando necessário, será solicitado novo aceite e registrada a nova versão. O uso anterior continuará regido pela versão vigente no período correspondente, respeitada a legislação.

### 3.14 Lei aplicável e solução de conflitos

Aplicam-se as leis da República Federativa do Brasil. As partes buscarão solução amigável pelos canais de atendimento. O foro competente será definido conforme a legislação aplicável, preservado o direito do consumidor de recorrer ao foro legalmente assegurado.

### 3.15 Contato

Atendimento geral: **[PREENCHER]**.  
Privacidade e dados pessoais: **[PREENCHER]**.

## 4. Controle de versões

| Versão | Data | Alterações |
| --- | --- | --- |
| `2026-09-10-v1` | 10/09/2026 | Cadastro inicial: nome, e-mail, senha, sessão e registro de aceite/ciência |
| `2026-09-11-v2` | 11/09/2026 | Perfil educacional: nível de Libras, objetivos, meta diária e conclusão do onboarding |

Ao adicionar nova funcionalidade, registre nesta tabela a coleta, a finalidade, a base legal, o fornecedor, a retenção e a mudança apresentada ao usuário.

## 5. Fontes oficiais consultadas

- Lei nº 13.709/2018 — LGPD: https://www.planalto.gov.br/ccivil_03/_ato2015-2018/2018/lei/l13709compilado.htm
- Direitos dos titulares — ANPD: https://www.gov.br/anpd/pt-br/assuntos/titular-de-dados-1
- Guia de agentes de tratamento e encarregado — ANPD: https://www.gov.br/anpd/pt-br/centrais-de-conteudo/materiais-educativos-e-publicacoes/guia-orientativo-para-definicoes-dos-agentes-de-tratamento-de-dados-pessoais-e-do-encarregado
- Autenticação por senha — Supabase: https://supabase.com/docs/guides/auth/passwords
- Gerenciamento de usuários — Supabase: https://supabase.com/docs/guides/auth/managing-user-data
- Row Level Security — Supabase: https://supabase.com/docs/guides/database/postgres/row-level-security
- Autenticação no servidor — Supabase: https://supabase.com/docs/guides/auth/server-side
