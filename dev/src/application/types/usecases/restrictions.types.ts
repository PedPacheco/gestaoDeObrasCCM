export type GetPulicationRestricitionOutput = {
  works: {
    id: number;
    ovnota: string | null;
    ordemdiagrama: string | null;
    executado: boolean;
    status: string;
    data_conclusao: Date | null;
    mun: string;
    regional: string;
    id_turma: number;
    prazo_fim: Date | null;
    id_grupo: number;
    tipo_obra: string;
    parceira: string;
    id_restricao_publicacao: number;
    restricao: string;
    criado_em: Date;
    id_restricao: number;
    responsabilidade: string | null;
    nome_responsavel: string | null;
    status_restricao: string | null;
    data_resolucao: Date | null;
    observacao: string | null;
    observacao_construcao: string | null;
    nome: string;
  }[];
};
