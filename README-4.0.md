# LumiLibras 4.0 — prática de gestos com câmera

Versão do documento: `2026-09-14-v4`

Este documento explica como o LumiLibras usa a câmera para acompanhar as mãos, cadastrar uma referência de gesto e validar a tentativa do estudante. A funcionalidade foi feita para crescer junto com o conteúdo: cada sinal pode ter seu próprio modelo e novos sinais podem ser adicionados sem reescrever o detector.

## O que foi instalado

O projeto usa `@mediapipe/tasks-vision@1.0.1`, especificamente o `HandLandmarker` do MediaPipe. Ele identifica até duas mãos por quadro e retorna 21 pontos por mão, incluindo pulso, dedos e articulações.

Durante `npm run setup:camera`, o script `scripts/setup-camera.mjs` faz três coisas:

1. copia o JavaScript e os arquivos WebAssembly do pacote para `src/assets/public/camera/runtime/`;
2. baixa o modelo oficial `hand_landmarker.task` do Google MediaPipe, caso ele ainda não exista;
3. calcula um SHA-256 para confirmar que o arquivo local foi baixado por completo.

O modelo é servido localmente depois da preparação. A câmera e os pontos não são enviados para o servidor.

## Fluxo completo

```text
Usuário abre uma lição
        ↓
CameraGesto pede acesso à câmera
        ↓
hand-worker.js carrega o HandLandmarker
        ↓
Cada quadro vira um ImageBitmap
        ↓
MediaPipe retorna landmarks e handedness
        ↓
CameraGesto desenha os pontos e guarda a mão atual
        ↓
Usuário cadastra uma posição ou valida a tentativa
```

### `src/assets/public/camera/hand-worker.js`

O worker mantém a inferência fora da interface para a página continuar responsiva.

- `init`: carrega `vision_bundle.js`, o WebAssembly e `hand_landmarker.task`.
- `frame`: recebe um quadro, chama `detectForVideo` e devolve `landmarks`, `worldLandmarks` e `handedness`.
- `ready`: avisa que o detector está pronto.
- `error`: informa uma falha sem travar a lição.

O detector está configurado para até duas mãos, modo de vídeo e confiança mínima de 65% para detecção/presença.

### `src/lib/handGeometry.js`

Essa biblioteca transforma os 21 pontos em informações úteis para validação:

- valida se a mão tem exatamente 21 pontos numéricos;
- normaliza a mão pelo tamanho do eixo pulso–dedo médio;
- calcula ângulos das articulações;
- classifica cada dedo como `Estendido`, `Flexionado` ou `Intermediário`;
- preserva a orientação do sinal.

Essa classificação é geométrica. Ela ajuda a conferir uma posição de mão, mas não é uma tradução automática de Libras e não deve ser usada como diagnóstico anatômico.

### `src/components/pratica/CameraGesto.jsx`

Esse é o componente reutilizável que aparece dentro da prática de cada sinal.

Ele controla:

- abertura e encerramento da câmera;
- criação e encerramento do worker;
- envio de quadros sem acumular frames pendentes;
- desenho dos pontos sobre o vídeo espelhado;
- cadastro da posição correta;
- comparação da tentativa com o modelo salvo;
- mensagens de permissão, erro e resultado.

Ao clicar em **Ir praticar**, o componente abre a camera em tela cheia. O video ocupa a maior parte da tela, o sensor fica abaixo dele e as acoes permanecem acessiveis na parte inferior. O botao **Validar gesto** fica em destaque; **Cadastrar posicao** prepara a referencia e o botao vermelho encerra a camera.

O sensor mostra os cinco dedos individualmente, com o estado esperado e o estado detectado. O indicador fica verde quando os estados coincidem.

O componente recebe:

```jsx
<CameraGesto sinalId={questao.id} termo={questao.termo} aoConcluir={avancarIntroducao} />
```

Por isso, qualquer curso que tenha questões com `id` e `termo` pode reutilizar a mesma prática.

## Como cadastrar um gesto

O cadastro é feito na própria tela do sinal:

1. abra a lição e clique em **Ir praticar**;
2. mostre a posição correta para a câmera;
3. espere aparecer a quantidade de mãos detectadas e use o sensor dos cinco dedos;
4. clique em **Cadastrar posição**;
5. desligue a câmera ou faça uma tentativa diferente;
6. clique em **Validar gesto** e, quando a nota atingir o mínimo, em **Concluir prática**.

O modelo salvo contém o termo, a quantidade de mãos, o estado dos cinco dedos e os pontos normalizados. Ele é salvo no `localStorage` do navegador com a chave:

```text
lumilibras:gesto:v1:<id-do-sinal>
```

Isso permite cadastrar um sinal por vez e testar imediatamente, sem depender de banco de dados.

## Como a validação funciona

A validação atual é para gestos estáticos ou para uma posição-chave do sinal:

1. compara a quantidade de mãos;
2. compara o estado de cada dedo;
3. compara a distância média entre os pontos normalizados;
4. combina os resultados em um percentual;
5. considera aprovado a partir de 90%.

Ao atingir 90% ou mais, a interface marca a pratica como concluida e exibe o aviso verde **Atividade concluida! Seu gesto esta correto.** O estudante pode tocar em **Concluir pratica** para avancar na licao.

Os dedos valem 70% da nota e a geometria dos pontos vale 30%. Se a quantidade de mãos estiver errada, a tentativa é recusada imediatamente e a interface informa quantas mãos devem aparecer.

O percentual é um retorno pedagógico, não uma medida oficial de proficiência. O limiar e os pesos podem ser ajustados em `CameraGesto.jsx` quando houver exemplos reais de cada conteúdo.

## Como adicionar novos conteúdos

Para um novo sinal estático, adicione uma questão no arquivo de dados do curso:

```json
{
  "id": 141,
  "termo": "Exemplo",
  "imagem": "/treinamento/sinais/exemplo.jpg",
  "unidade": 14,
  "alternativas": ["...", "...", "...", "..."],
  "correta": 0
}
```

Depois que a questão aparecer na fase de estudo, o `CameraGesto` será criado automaticamente com o `id` e o `termo` dela. O primeiro cadastro da posição cria o modelo local daquele sinal.

Para conteúdos dinâmicos, com movimento, o próximo passo é cadastrar uma sequência de modelos em vez de uma única posição. A estrutura pode evoluir para:

```json
{
  "tipo": "sequencia",
  "quadros": ["modelo-inicial", "modelo-meio", "modelo-final"],
  "duracaoMinimaMs": 700
}
```

Nesse modo, o avaliador deverá conferir ordem, direção e duração do movimento. A versão atual ainda não valida movimento contínuo nem expressões faciais.

## Privacidade e permissões

- A permissão é solicitada somente quando o estudante clica em **Ir praticar**.
- O áudio nunca é solicitado.
- O vídeo fica no navegador e não é gravado.
- Os pontos usados para o modelo ficam no `localStorage` deste navegador.
- Ao clicar em desligar ou sair da página, as trilhas da câmera e o worker são encerrados.

Em produção, a câmera precisa ser usada em HTTPS ou em `localhost`. Em desenvolvimento, a URL padrão é `http://localhost:5173`.

## Comandos de desenvolvimento

```powershell
npm install
npm run setup:camera
npm run dev
npm run check
```

O teste isolado do detector está disponível em:

```text
http://localhost:5173/camera/teste.html
```

Ele serve para confirmar câmera, WebAssembly, modelo e contagem de pontos sem entrar no fluxo de login ou de uma lição.

## Limitações conhecidas

O detector reconhece pontos anatômicos; ele não conhece sozinho o significado de uma palavra em Libras. O significado vem do conteúdo cadastrado e a validação compara a referência preparada para aquele sinal.

A referência precisa ser cadastrada com boa iluminação, mão inteira visível e enquadramento semelhante ao da tentativa. Sinais com deslocamento, contato entre as mãos, orientação complexa ou componente facial precisam de uma etapa futura de validação temporal e multimodal.
