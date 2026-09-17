export const PERSONAGENS = Object.freeze([
  {
    id: 'lumi', nome: 'Lumi', especie: 'Arara-azul', papel: 'Guia da jornada',
    especialidade: 'Orientação e apoio', visualPadrao: 'classica',
    habilidade: { id: 'asas-orientacao', nome: 'Asas da Orientação', descricao: 'Após dois erros no mesmo sinal, mostra uma dica visual sobre a posição, sem revelar a resposta.', limite: '1 vez por fase' },
  },
  {
    id: 'nino', nome: 'Nino', especie: 'Mico-leão-dourado', papel: 'Guardião do conhecimento',
    especialidade: 'Memória e revisão', visualPadrao: 'mico-leao',
    habilidade: { id: 'memoria-dourada', nome: 'Memória Dourada', descricao: 'Reúne até três sinais difíceis em uma revisão ao fim da fase. XP exige acertos nessa revisão.', limite: '1 revisão por fase' },
  },
  {
    id: 'kira', nome: 'Kira', especie: 'Onça-pintada', papel: 'Protetora da floresta',
    especialidade: 'Coragem e recuperação', visualPadrao: 'kira',
    habilidade: { id: 'olhar-preciso', nome: 'Olhar Preciso', descricao: 'Na câmera, destaca a parte da posição das mãos que mais precisa de atenção.', limite: '1 vez por sinal' },
  },
  {
    id: 'mila', nome: 'Mila', especie: 'Capivara', papel: 'Companheira tranquila',
    especialidade: 'Calma e constância', visualPadrao: 'mila',
    habilidade: { id: 'ritmo-tranquilo', nome: 'Ritmo Tranquilo', descricao: 'Depois de dois erros seguidos, permite uma tentativa sem perder coração.', limite: '1 vez por fase' },
  },
]);

export const SKINS = Object.freeze([
  { id: 'classica', personagem: 'lumi', nome: 'Lumi Clássica', cosmetica: true },
  { id: 'aurora', personagem: 'lumi', nome: 'Lumi Aurora', cosmetica: true },
  { id: 'dourada', personagem: 'lumi', nome: 'Lumi Dourada', cosmetica: true },
  { id: 'enfermeira-arara', personagem: 'lumi', nome: 'Lumi Enfermeira', habilidade: { id: 'cura-conhecimento', nome: 'Cura do Conhecimento', descricao: 'Acerte pelo menos quatro de cinco sinais já estudados para recuperar um coração.', limite: '1 vez por dia' } },
  { id: 'mico-leao', personagem: 'nino', nome: 'Nino', cosmetica: true },
  { id: 'historiador', personagem: 'nino', nome: 'Nino Historiador', habilidade: { id: 'ecos-historia', nome: 'Ecos da História', descricao: 'Uma curiosidade cultural e uma pergunta bônus nas aulas de História da Libras.', limite: '1 vez por aula' } },
  { id: 'kira', personagem: 'kira', nome: 'Kira', cosmetica: true },
  { id: 'bombeira', personagem: 'kira', nome: 'Kira Bombeira', habilidade: { id: 'missao-resgate', nome: 'Missão de Resgate', descricao: 'Acerte três questões de resgate para ganhar uma tentativa extra na avaliação.', limite: '1 vez por avaliação' } },
  { id: 'mila', personagem: 'mila', nome: 'Mila', cosmetica: true },
  { id: 'mila-pijama', personagem: 'mila', nome: 'Mila Pijama', habilidade: { id: 'descanso-memoria', nome: 'Descanso da Memória', descricao: 'Prepara três sinais do dia para revisar no próximo acesso.', limite: '1 vez por dia' } },
]);

export const personagemPorId = id => PERSONAGENS.find(personagem => personagem.id === id);
export const skinPorId = id => SKINS.find(skin => skin.id === id);
export const personagemDaSkin = id => skinPorId(id)?.personagem || 'lumi';
