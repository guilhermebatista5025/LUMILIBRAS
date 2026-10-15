# Modelo inicial do alfabeto

`modelo/` foi convertido de Keras para TensorFlow.js a partir do modelo publicado
em https://github.com/LauraMattosc/libras. O fluxo original de recortar a mão,
redimensionar para 224×224 e normalizar os pixels para `[-1, 1]` foi preservado.

O modelo possui cinco saídas. O código original identifica as quatro primeiras
como A, B, C e D; a quinta é tratada como fundo/sem letra. Ele é um protótipo e
não deve ser apresentado como reconhecedor do alfabeto completo.
