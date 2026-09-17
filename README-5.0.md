# LumiLibras 5.0 — visão do aplicativo

> Documento de visão do produto. Descreve o aplicativo a partir da experiência de quem aprende, o que já existe e o que ainda precisa ser construído.

## O que é o LumiLibras

O LumiLibras é um aplicativo web para aprender e praticar a Língua Brasileira de Sinais (Libras) em etapas curtas. A pessoa estuda sinais por tema, observa referências visuais, pratica com a câmera quando a atividade oferece esse recurso e acompanha seu progresso em uma trilha.

A experiência usa personagens brasileiros, recompensas e metas para tornar a prática frequente mais convidativa. A Lumi, uma arara, apresenta e acompanha a jornada. Nino, o mico-leão-dourado, Kira, a onça, e Mila, a capivara, também fazem parte do universo visual do aplicativo.

## Que problema queremos resolver

Começar a aprender Libras pode ser difícil quando o conteúdo está disperso, falta uma sequência clara de estudo e a pessoa não recebe retorno enquanto tenta reproduzir um sinal. Assistir a uma demonstração também não garante que ela tenha praticado ou lembrará do conteúdo depois.

O LumiLibras reúne estudo, exercício e acompanhamento no mesmo lugar. A proposta é ajudar o estudante a saber **o que praticar agora**, rever sinais no próprio ritmo e enxergar seu avanço. Ele é um apoio ao aprendizado; não substitui aulas com professores de Libras, a convivência com a comunidade surda nem a avaliação de um profissional.

## Para quem é

- Pessoas que estão começando a aprender Libras e precisam de uma trilha organizada.
- Estudantes que querem revisar vocabulário por contexto e manter uma rotina de prática.
- Pessoas interessadas em comunicação mais acessível, inclusive em situações de saúde, tema do primeiro curso com atividades completas.

O nível inicial, os objetivos de estudo e a meta diária são escolhidos no começo da jornada. Essas escolhas ajudam a apresentar o estudante ao aplicativo; nem todos os cursos já têm aulas completas ou adaptação automática de dificuldade.

## Como é a jornada de aprendizado

1. **Entrar e se apresentar:** criar conta ou entrar, escolher nível, objetivos e meta diária.
2. **Escolher um tema:** navegar por categorias como Saúde, Básico, Intermediário, Avançado e História da Libras.
3. **Estudar uma unidade:** seguir fases com imagens sequenciais de sinais e, quando disponível, vídeo.
4. **Praticar:** observar a referência e tentar reproduzir a posição das mãos diante da câmera nas atividades que oferecem prática guiada.
5. **Responder e revisar:** associar imagens e palavras, fazer avaliações e consultar o resultado para rever erros.
6. **Acompanhar o progresso:** ver fases concluídas, XP, nível, corações, moedas, diamantes, ranking e itens da loja.

A primeira trilha com atividades completas é **Libras no contexto da saúde**. Ela organiza 139 sinais em 13 unidades, com fases de estudo e avaliações baseadas na cartilha disponível no projeto. Os outros temas já têm módulos e descrições para orientar a navegação, mas suas aulas estão em preparação. Concluir uma unidade de Saúde exige finalizar os estudos e alcançar pelo menos 80% na avaliação.

## O que a câmera faz hoje

A prática guiada usa pontos das mãos detectados pelo MediaPipe para comparar uma tentativa com posições de referência de um sinal. A tela mostra orientações, semelhança e progresso de cada posição. O limiar atual de conclusão é 90% de semelhança na comparação implementada.

Essa análise ajuda a treinar **posições das mãos**. Ela não interpreta conversas em Libras, não avalia toda a expressão facial e corporal e não garante que um sinal completo esteja linguisticamente correto. O movimento e o contexto continuam importantes. As referências são extraídas das imagens da lição e comparadas no navegador; o app não envia o vídeo da câmera ao servidor para essa comparação.

## Motivação e recompensas

O progresso das atividades é associado à conta do estudante. XP e níveis mostram continuidade; corações regulam novas tentativas em algumas atividades; diamantes são ganhos ao concluir fases pela primeira vez; moedas são concedidas pelo acesso diário. A loja permite trocar moedas ou diamantes por recarga de corações, impulso de XP e visuais. O ranking apresenta estudantes reais pela pontuação de XP.

As conquistas aparecem como uma coleção, mas os critérios de desbloqueio ainda precisam ser definidos e ativados. Nenhuma medalha deve ser apresentada como recompensa já conquistada sem esse critério.

Recompensas servem para incentivar a prática. A medida principal de avanço continua sendo o que o estudante consegue compreender, lembrar e sinalizar em situações reais.

## Personagens, skins e habilidades: próximo passo

Para a próxima evolução da loja, os conceitos terão papéis separados:

| Conceito | Significado proposto | Exemplo |
| --- | --- | --- |
| Personagem | Quem acompanha o estudante, com nome e identidade próprios | Lumi, Nino, Kira e Mila |
| Skin | Aparência alternativa de um personagem, sem criar outro personagem | Nino Historiador, Lumi Enfermeira, Kira Bombeira |
| Habilidade | Efeito definido para um personagem ou visual, com regra clara no aprendizado | Ainda não definida nem implementada |

Hoje o código da loja ainda registra e equipa todos os novos visuais na mesma categoria técnica de `skin`. Comprar um visual troca a imagem do mascote mostrada em algumas telas; isso **não concede uma habilidade**. As skins Aurora e Dourada também são variações visuais existentes. Mila ainda não possui arte nem item na loja.

Antes de implementar habilidades, será preciso definir para cada uma: o benefício exato, quando ele ativa, duração ou limite, como aparece para o estudante e como evitar que uma compra substitua o aprendizado por vantagem excessiva. A separação dos dados e da interface deve preservar as compras já feitas.

## Situação atual e limites

O LumiLibras já oferece cadastro e acesso, trilha de Saúde, exercícios, prática de posições com câmera, progresso, ranking, perfil e loja no código do projeto. Algumas funções dependem das migrações do banco de dados estarem aplicadas no Supabase conectado ao ambiente. As artes recentes de Nino, Lumi Enfermeira e Kira Bombeira estão no projeto, mas sua disponibilidade para compra no ambiente hospedado depende da atualização do catálogo no banco.

Ainda não estão completos: as aulas dos demais cursos, critérios das conquistas, a distinção técnica entre personagens e skins, habilidades dos personagens e a arte da Mila. Essas partes são próximas etapas de desenvolvimento, não recursos prometidos pela versão atual.

## Como o projeto está organizado

- **Interface:** React, Vite, JavaScript e Tailwind CSS, em `src/`.
- **API:** Node.js e Express, em `server/`.
- **Conta e progresso:** Supabase Auth e PostgreSQL, acessados pela API.
- **Referências de sinais:** dados em `src/data/` e imagens em `src/assets/public/treinamento/`.
- **Prática com câmera:** interface em `src/components/pratica/` e MediaPipe em `src/assets/public/camera/`.
- **Imagens dos personagens:** arquivos de origem em `src/assets/`; `dist/` é o resultado gerado pelo build.

Para executar localmente, use `npm install` e `npm run dev` após configurar as variáveis de ambiente descritas em [README.md](README.md). O frontend usa `http://localhost:5173` e a API, `http://localhost:3001`. Para detalhes de autenticação e privacidade, consulte [README-2.0.md](README-2.0.md); para a prática com câmera, [README-4.0.md](README-4.0.md).

## Direção do produto

O objetivo é transformar curiosidade inicial em prática contínua e útil. Cada nova fase deve manter três compromissos: conteúdo de Libras contextualizado, retorno honesto sobre o que o aplicativo consegue avaliar e uma experiência acessível que respeite a língua e a comunidade surda.
