# Reconhecimento de Libras em vídeo

Esta pasta inicia o reconhecedor de **sinais isolados em vídeo** do LUMILIBRAS.
O objetivo não é traduzir uma conversa livre: durante uma atividade, a aplicação
sabe qual conjunto pequeno de sinais pode aparecer e valida o movimento completo
feito pelo aluno.

## Referências estudadas

| Projeto | O que oferece | Como será usado |
| --- | --- | --- |
| [Dudu197/sign-language-recognition](https://github.com/Dudu197/sign-language-recognition) | Extrai landmarks de vídeos de Libras, transforma a sequência em representação de esqueleto e treina CNNs/ResNet. | Referência principal desta implementação. |
| [Dudu197/sign-language-recognition-model](https://github.com/Dudu197/sign-language-recognition-model) | Versão simplificada do treinamento do projeto anterior. | Referência para tornar o treinamento reproduzível. |
| [Malta-Lab/ISLR_LIBRAS](https://github.com/Malta-Lab/ISLR_LIBRAS) | Pipeline de vídeos, tensores, PyTorch Lightning, ResNet 3D e o conjunto MALTA-LIBRAS. | Comparação futura com modelos que recebem RGB diretamente. |
| [TensorFlow MoViNet](https://www.tensorflow.org/hub/tutorials/movinet) | Classificação temporal eficiente e modo de vídeo contínuo. | Alternativa futura para reconhecimento em streaming. Não reconhece Libras sem novo treinamento. |
| [Captar-Libras](https://verlab.github.io/captar-libras/) | Vídeos multimodais de Libras no domínio médico, com alinhamento temporal. | Possível fonte futura de dados de saúde, sujeita aos termos e à autorização de acesso. |
| [MINDS-Libras](https://zenodo.org/records/2667329) | Dataset de sinais isolados em Libras. | Benchmark e pré-treinamento opcional. |
| [LIBRAS-UFOP](https://www.sciencedirect.com/science/article/pii/S0957417420309143) | Dataset multimodal de sinais dinâmicos e pares mínimos. | Benchmark para movimentos visualmente semelhantes. |
| [WLASL](https://github.com/dxli94/WLASL) | Dataset e modelos de reconhecimento de sinais isolados em ASL. | Referência metodológica; seus rótulos não são Libras. |
| [LauraMattosc/libras](https://github.com/LauraMattosc/libras) | Classificação de recortes da mão em cada frame com Keras. | Protótipo de inferência; não modela a sequência temporal e só possui as classes A–D. |

Antes de incorporar vídeos ou modelos de terceiros, confira a licença do código e
os termos específicos do dataset. O código de Dudu197 está sob Apache-2.0; esta
implementação foi reescrita para o LUMILIBRAS e mantém a atribuição acima.

## Arquitetura adotada

```text
vídeos rotulados
  -> MediaPipe (pose + mão esquerda + mão direita)
  -> sequência normalizada de 48 instantes
  -> imagem temporal [x, y, velocidade]
  -> ResNet-18
  -> sinal previsto + confiança
  -> exportação ONNX
```

O vídeo continua sendo decodificado em frames, mas eles não são tratados como
amostras independentes. Um vídeo inteiro gera uma amostra temporal. Assim o
modelo preserva direção, trajetória e velocidade do gesto.

## Organização dos vídeos

Use uma pasta por atividade, sinal e pessoa. Nunca misture vídeos da mesma pessoa
entre treino e validação.

```text
ml/video_recognition/data/videos/
  saude/
    hospital/
      pessoa-01/
        repeticao-01.mp4
        repeticao-02.mp4
      pessoa-02/
        repeticao-01.mp4
    pronto-socorro/
      pessoa-01/
        repeticao-01.mp4
    nao-sinal/
      pessoa-01/
        parado.mp4
        movimento-aleatorio.mp4
```

`nao-sinal` é obrigatório para uma avaliação real: ele impede que qualquer
movimento receba automaticamente o nome do sinal esperado. Para um primeiro
experimento, procure gravar pelo menos 5 pessoas e 10 repetições de cada sinal.

## Ambiente

MediaPipe ainda não oferece a mesma compatibilidade em todas as versões do
Python. Use Python 3.10, 3.11 ou 3.12 em um ambiente separado:

```powershell
py -3.11 -m venv ml/video_recognition/.venv
ml/video_recognition/.venv/Scripts/Activate.ps1
python -m pip install -r ml/video_recognition/requirements.txt
```

## Uso

1. Valide nomes, classes e quantidade de pessoas:

```powershell
python ml/video_recognition/scripts/validate_dataset.py
```

2. Extraia uma sequência de landmarks de cada vídeo:

```powershell
python ml/video_recognition/scripts/extract_landmarks.py
```

3. Treine a ResNet-18 usando separação por pessoa:

```powershell
python ml/video_recognition/scripts/train_model.py --epochs 30
```

4. Exporte o melhor modelo para ONNX:

```powershell
python ml/video_recognition/scripts/export_onnx.py saude
```

Os arquivos gerados ficam em `data/features` e `artifacts`, que não devem ser
versionados. `artifacts/labels.json` registra a ordem exata das classes.

## Protótipo oficial atual

Enquanto ainda não há vídeos de várias pessoas para treinar a ResNet, o aplicativo
já oferece uma versão funcional em `/reconhecimento`. Ela usa MediaPipe no
navegador, extrai 28 quadros de um dos cinco vídeos locais e compara a sequência
da câmera com alinhamento temporal. Esse protótipo não depende do ambiente Python.

Para apresentar:

```powershell
npm run dev
```

Abra `http://localhost:5173/reconhecimento`, aguarde o botão **Fazer o sinal** ser
habilitado, assista ao vídeo e repita o movimento diante da câmera.

## Estado do pipeline de treinamento

- Convenção de dataset definida e validável.
- Extração temporal de pose e duas mãos implementada com MediaPipe.
- Normalização pela posição e largura dos ombros.
- Conversão da sequência para uma representação Skeleton-DML adaptada.
- Treinamento ResNet-18 com divisão por pessoa, e não por frames.
- Exportação ONNX preparada.
- A inferência ONNX substituirá a comparação temporal atual quando existir um
  modelo treinado com vídeos reais e uma classe `nao-sinal`.
