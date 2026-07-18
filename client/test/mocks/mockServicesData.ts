export const servicesNotScheduledDataMock = [
  {
    id: 1,
    idObra: 100,
    operacao: "INSTALACAO",
    ponto: "P1",
    material: "CABO 10MM",
    textoBreve: "Instalação de cabo",
    dataProgramada: "2026-03-01",
    qtdePlanejada: 10,
    qtdeAdicional: 2,
    qtdeProgramada: 12,
    qtdeRealizada: 8,
    preco: 50,
    valorUnit: 600,
    valorReal: 400,
  },
  {
    id: 2,
    idObra: 100,
    operacao: "MANUTENCAO",
    ponto: "P2",
    material: "DISJUNTOR 40A",
    textoBreve: "Substituição de disjuntor",
    dataProgramada: "2026-03-05",
    qtdePlanejada: 5,
    qtdeAdicional: 0,
    qtdeProgramada: 5,
    qtdeRealizada: 5,
    preco: 120,
    valorUnit: 600,
    valorReal: 600,
  },
  {
    id: 3,
    idObra: 200,
    operacao: "REPARO",
    ponto: "P3",
    material: "POSTE CONCRETO",
    textoBreve: "Reparo estrutural",
    dataProgramada: null,
    qtdePlanejada: 3,
    qtdeAdicional: 1,
    qtdeProgramada: 4,
    qtdeRealizada: 2,
    preco: 1000,
    valorUnit: 4000,
    valorReal: 2000,
  },
];

export const servicesScheduledDataMock = [
  {
    id: 1,
    idObra: 100,
    operacao: "INSTALACAO",
    ponto: "P1",
    material: "CABO 16MM",
    textoBreve: "Instalação de cabo de média tensão",
    dataProgramada: "2026-03-10",
    qtdePlanejada: 10,
    qtdeProgramada: 8,
    qtdeRealizada: 6,
    qtdeAdicional: 2,
    preco: 45,
    equipe: "Equipe Alfa",
    encarregado: "João Silva",
    perfil: "ELETRICISTA",
    valorUnit: 360,
  },
  {
    id: 2,
    idObra: 100,
    operacao: "MANUTENCAO",
    ponto: "P2",
    material: "TRANSFORMADOR 75KVA",
    textoBreve: "Manutenção preventiva",
    dataProgramada: "2026-03-12",
    qtdePlanejada: 5,
    qtdeProgramada: 5,
    qtdeRealizada: 5,
    qtdeAdicional: 0,
    preco: 1200,
    equipe: "Equipe Beta",
    encarregado: "Carlos Souza",
    perfil: "TECNICO",
    valorUnit: 6000,
  },
  {
    id: 3,
    idObra: 200,
    operacao: "REPARO",
    ponto: "P3",
    material: "POSTE CONCRETO",
    textoBreve: "Substituição de poste danificado",
    dataProgramada: "2026-03-15",
    qtdePlanejada: 3,
    qtdeProgramada: 4,
    qtdeRealizada: 2,
    qtdeAdicional: 1,
    preco: 950,
    equipe: "Equipe Gama",
    encarregado: "Marcos Lima",
    perfil: "ENCARREGADO",
    valorUnit: 3800,
  },
];

export const servicesFiltersMock = {
  services: [{ texto_breve: "ESTRUTURA" }],
  points: [{ ponto: "P1" }],
  operations: [{ operacao: "INSTALAÇÃO" }],
};

export const servicesContractsMock = [
  {
    id: 1,
    texto_breve: "Instalação de cabo subterrâneo",
    material: "CABO 25MM",
    preco: 75.5,
    contrato: "CTR-2026-001",
    medida: "M",
    turmas: {
      turma: "Turma A",
    },
  },
  {
    id: 2,
    texto_breve: "Substituição de transformador",
    material: "TRANSFORMADOR 112KVA",
    preco: 3200,
    contrato: "CTR-2026-002",
    medida: "UN",
    turmas: {
      turma: "Turma B",
    },
  },
  {
    id: 3,
    texto_breve: "Instalação de poste",
    material: "POSTE CONCRETO 9M",
    preco: 950,
    contrato: "CTR-2026-003",
    medida: "UN",
    turmas: {
      turma: "Turma C",
    },
  },
];

export const servicesTeamsMock = [
  { id: 1, equipe: "LM01", encarregado: "Alisson", perfil: "C4" },
  { id: 1, equipe: "LM02", encarregado: "Alisson", perfil: "C3" },
];

export const programacaoServicosMock = [
  {
    id: 1,
    id_servico: 1001,
    servicos: {
      servicos_contratos: {
        texto_breve: "Instalação de cabo BT",
      },
      ponto: "P1",
      operacao: "INSTALACAO",
    },
    id_programacao: 500,
    programacoes: {
      data_prog: "2026-03-10",
    },
    equipes: {
      equipe: "Equipe Alfa",
    },
    prog: 8,
    plan: 10,
    real: 6,
    adicional: 2,
  },
  {
    id: 2,
    id_servico: 1002,
    servicos: {
      servicos_contratos: {
        texto_breve: "Manutenção em transformador",
      },
      ponto: "P2",
      operacao: "MANUTENCAO",
    },
    id_programacao: 501,
    programacoes: {
      data_prog: "2026-03-12",
    },
    equipes: {
      equipe: "Equipe Beta",
    },
    prog: 5,
    plan: 5,
    real: 5,
    adicional: 0,
  },
  {
    id: 3,
    id_servico: 1003,
    servicos: {
      servicos_contratos: {
        texto_breve: "Substituição de poste",
      },
      ponto: "P3",
      operacao: "REPARO",
    },
    id_programacao: 502,
    programacoes: {
      data_prog: "2026-03-15",
    },
    equipes: {
      equipe: "Equipe Gama",
    },
    prog: 4,
    plan: 3,
    real: 2,
    adicional: 1,
  },
];
