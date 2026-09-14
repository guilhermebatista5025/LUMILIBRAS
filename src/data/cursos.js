// Saúde segue o índice da cartilha local (páginas 11–17).
// Os demais roteiros organizam categorias cujas aulas ainda não foram publicadas.
const unidade = (id, titulo, icone, sinais, pagina) => ({ id, titulo, icone, sinais, pagina });
const roteiro = itens => itens.map(([titulo, icone, descricao], indice) => ({ id: indice + 1, titulo, icone, descricao }));

export const CURSOS = {
  saude: {
    id: "saude", titulo: "Libras no contexto da saúde", etiqueta: "Cartilha completa", icone: "saude", tema: "azul",
    incentivo: "Explore os 139 sinais da cartilha e avance no seu ritmo.",
    unidades: [
      unidade(1, "Locais de saúde", "hospital", 6, 18),
      unidade(2, "Transporte de pacientes", "ambulancia", 1, 21),
      unidade(3, "Profissionais de saúde", "profissionais", 16, 22),
      unidade(4, "Procedimentos e exames", "exames", 14, 32),
      unidade(5, "Prevenção e vacinação", "vacina", 2, 40),
      unidade(6, "Sintomas gerais", "termometro", 27, 42),
      unidade(7, "Doenças e condições clínicas", "saude", 47, 58),
      unidade(8, "Prescrições médicas", "receita", 4, 83),
      unidade(9, "Cirurgias", "cirurgia", 5, 86),
      unidade(10, "Recuperação e reabilitação", "reabilitacao", 1, 89),
      unidade(11, "Procedimentos hospitalares", "curativo", 9, 90),
      unidade(12, "Convênios médicos", "convenio", 3, 96),
      unidade(13, "Hospitais em Linhares – ES", "local", 4, 98),
    ],
  },
  basico: {
    id: "basico", titulo: "Libras Básico para iniciantes", etiqueta: "Primeiros passos", icone: "mao", tema: "verde", nivel: "Iniciante", emPreparacao: true,
    incentivo: "Conheça os módulos que vão acompanhar seus primeiros sinais.",
    unidades: roteiro([
      ["Conhecendo a Libras", "mao", "Uma introdução à comunicação visual e à comunidade surda."],
      ["Alfabeto manual", "alfabeto", "Apresentação das letras e da soletração de nomes."],
      ["Saudações e apresentações", "conversa", "Cumprimentos e apresentações em situações do cotidiano."],
      ["Números e quantidades", "numeros", "Números e expressões de quantidade."],
      ["Família e pessoas", "profissionais", "Vocabulário para falar de família e relações pessoais."],
      ["Cores e objetos", "cores", "Objetos do dia a dia e suas cores."],
      ["Dias, horários e rotina", "calendario", "Dias da semana, horários e atividades da rotina."],
      ["Minhas primeiras conversas", "conversa", "Revisão do vocabulário em pequenas situações de diálogo."],
    ]),
  },
  intermediario: {
    id: "intermediario", titulo: "Libras Intermediário", etiqueta: "Amplie seu repertório", icone: "conversa", tema: "azul", nivel: "Intermediário", emPreparacao: true,
    incentivo: "Explore o próximo passo da sua comunicação em Libras.",
    unidades: roteiro([
      ["Expressões faciais e corporais", "expressao", "Expressividade e recursos visuais na comunicação."],
      ["Espaço e localização", "local", "Referências espaciais para apresentar pessoas e lugares."],
      ["Verbos e ações do cotidiano", "atividade", "Ampliação do repertório para conversar sobre a rotina."],
      ["Perguntas e respostas", "conversa", "Organização de perguntas e interações em Libras."],
      ["Alimentação e compras", "compras", "Conversas em mercados, lojas e restaurantes."],
      ["Escola e trabalho", "escola", "Vocabulário e situações dos ambientes de estudo e trabalho."],
      ["Transportes e direções", "transporte", "Deslocamentos, trajetos e orientação na cidade."],
      ["Narrativas do cotidiano", "livro", "Sequências de acontecimentos e relatos de experiências."],
    ]),
  },
  avancado: {
    id: "avancado", titulo: "Libras Avançado", etiqueta: "Novos desafios", icone: "coroa", tema: "roxo", nivel: "Avançado", emPreparacao: true,
    incentivo: "Descubra os módulos para aprofundar sua jornada em Libras.",
    unidades: roteiro([
      ["Estruturas da Libras", "alfabeto", "Estudo das estruturas linguísticas em situações de uso."],
      ["Classificadores em contexto", "mao", "Recursos para descrever formas, movimentos e situações."],
      ["Narrativas e perspectivas", "livro", "Construção de narrativas com diferentes pontos de vista."],
      ["Argumentação e debates", "conversa", "Organização de ideias e participação em discussões."],
      ["Variações linguísticas", "local", "Diversidade de usos da Libras em diferentes comunidades."],
      ["Comunicação profissional", "trabalho", "Interações em ambientes profissionais e institucionais."],
      ["Tradução e interpretação", "profissionais", "Introdução aos contextos de tradução e interpretação."],
      ["Prática integrada", "trofeu", "Integração do repertório em situações de comunicação."],
    ]),
  },
  historia: {
    id: "historia", titulo: "A história da Libras no Brasil", etiqueta: "História e cultura", icone: "livro", tema: "dourado", emPreparacao: true,
    incentivo: "Conheça os temas dessa jornada pela história da Libras.",
    unidades: roteiro([
      ["Comunidade e identidade surda", "profissionais", "Identidade, pertencimento e experiências da comunidade surda."],
      ["Origens da educação de surdos", "escola", "Um percurso pelos primeiros espaços de educação de surdos."],
      ["A trajetória da Libras", "mao", "A formação e a presença da Libras na sociedade brasileira."],
      ["Movimentos e conquistas", "trofeu", "O protagonismo da comunidade surda em suas conquistas."],
      ["Cultura e expressão surda", "cores", "Arte, literatura e formas de expressão cultural."],
      ["Libras no presente", "conversa", "Acessibilidade, educação e participação na sociedade."],
    ]),
  },
};

export const VIDEOS_SAUDE = [
  { titulo: "Consultório médico", arquivo: "consultório-médio.webm" },
  { titulo: "Hospital", arquivo: "Hospital.webm" },
  { titulo: "Hospital especializado em doenças mentais", arquivo: "Hospital-Especializado-em-Doenças-Mentais.webm" },
  { titulo: "Hospital particular", arquivo: "Hospital-Particular.webm" },
  { titulo: "Pronto-socorro", arquivo: "Pronto-socorro.webm" },
];
