import { Prisma } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export type FindD5NotesQueryResult = {
  id: number;
  local_instalacao: string | null;
  criado_em: Date;
  conclusao_nota: Date | null;
  status_sap: string;
  tme_executado: number | null;
  tme_abertura: number | null;
  validacao_anual: boolean | null;
  mo_planejada: Decimal;
  nota_d5: string;
  obras: {
    ovnota: string | null;
    diagrama: string | null;
    ordem_dci: string | null;
    ordem_dca: string | null;
    ordem_dcd: string | null;
    ordem_dcim: string | null;
  } | null;
  municipios: {
    mun_minusculo: string;
    regionais: {
      regional: string;
    };
  };
  tipos: {
    tipo_obra: string;
  };
  turmas: {
    turma: string;
  };
  status: {
    status: string;
  };
  novo_tabela_usuarios: {
    nome: string;
  } | null;
};

export const d5NoteByIdSelect = {
  id: true,
  local_instalacao: true,
  criado_em: true,
  conclusao_nota: true,
  status_sap: true,
  tme_executado: true,
  tme_abertura: true,
  validacao_anual: true,
  mo_planejada: true,
  nota_d5: true,
  obras: {
    select: {
      ovnota: true,
      diagrama: true,
      ordem_dci: true,
      ordem_dca: true,
      ordem_dcd: true,
      ordem_dcim: true,
    },
  },
  municipios: {
    select: {
      mun_minusculo: true,
      regionais: { select: { regional: true } },
    },
  },
  status: { select: { status: true } },
  tipos: { select: { tipo_obra: true } },
  turmas: { select: { turma: true } },
  novo_tabela_usuarios: { select: { nome: true } },
  programacoes_d5: { select: { prog: true, exec: true } },
} satisfies Prisma.notas_d5Select;

export type D5NoteByIdQueryResult = Prisma.notas_d5GetPayload<{
  select: typeof d5NoteByIdSelect;
}>;

export type SchedulesD5NotesByNoteIdQueryResult = {
  id: number;
  id_nota_d5: number;
  criado_em: Date;
  data_prog: Date;
  hora_ini: Date;
  hora_ter: Date;
  prog: number;
  exec: number;
  equipe_lm: number;
  equipe_lv: number;
  equipe_reg: number;
  chave_provisoria: boolean;
  chi: number;
  num_dp: string | null;
  tipo_servico: string | null;
  observacao_execucao: string | null;
  observacao_programacao: string | null;
  usuario_criador: { nome: string } | null;
  usuario_modificador: { nome: string } | null;
  restricoes: { id: number; restricao: string };
  tecnicos: { id: number; tecnico: string };
  responsavel_restricao: string | null;
  caminhos_arquivos: string[];
};

export type SchedulesD5NotesQueryResult = {
  data_prog: Date;
  hora_ini: Date;
  hora_ter: Date;
  prog: number;
  exec: number;
  equipe_lm: number;
  equipe_lv: number;
  equipe_reg: number;
  chave_provisoria: boolean;
  chi: number;
  num_dp: string | null;
  tipo_servico: string | null;
  observacao_programacao: string | null;
  tecnicos: { tecnico: string };
  notas_d5: {
    id: number;
    local_instalacao: string | null;
    criado_em: Date;
    conclusao_nota: Date | null;
    status_sap: string;
    tme_executado: number | null;
    tme_abertura: number | null;
    validacao_anual: boolean | null;
    mo_planejada: Decimal;
    nota_d5: string;
    obras: {
      ovnota: string | null;
      diagrama: string | null;
      ordem_dci: string | null;
      ordem_dca: string | null;
      ordem_dcd: string | null;
      ordem_dcim: string | null;
    } | null;
    municipios: {
      mun_minusculo: string;
      regionais: {
        regional: string;
      };
    };
    tipos: {
      tipo_obra: string;
    };
    turmas: {
      turma: string;
    };
    status: {
      status: string;
    };
    novo_tabela_usuarios: {
      nome: string;
    } | null;
  };
};

export type SchedulesD5NotesByIdQueryResult = {
  id: number;
  id_nota_d5: number;
  data_prog: Date;
  hora_ini: Date;
  hora_ter: Date;
  prog: number;
  exec: number;
  equipe_lm: number;
  equipe_lv: number;
  equipe_reg: number;
  chave_provisoria: boolean;
  chi: number;
  num_dp: string | null;
  tipo_servico: string | null;
  observacao_execucao: string | null;
  observacao_programacao: string | null;
  responsavel_restricao: string | null;
  id_usuario_criador: number;
  id_usuario_modificador: number;
  id_restricao: number;
  id_tecnico: number;
  caminhos_arquivos: string[];
};

export type D5NoteScheduleCreateData = {
  id_nota_d5: number;
  data_prog: Date;
  prog: number;
  exec?: number;
  hora_ini?: Date;
  hora_ter?: Date;
  observacao_programacao?: string;
  observacao_execucao?: string;
  num_dp?: string;
  tipo_servico?: string;
  chi?: number;
  equipe_lv: number;
  equipe_lm: number;
  equipe_reg: number;
  chave_provisoria: boolean;
  id_tecnico: number;
  id_restricao: number;
  responsavel_restricao?: string;
  id_usuario_criador: number;
  id_usuario_modificador: number;
};

export type D5NoteScheduleUpdateData = Omit<
  D5NoteScheduleCreateData,
  'id_nota_d5' | 'id_usuario_criador'
> & {
  caminhos_arquivos: string[];
};

export type D5NoteScheduleListItem = {
  // Programação
  data_prog: Date;
  hora_ini: Date | null;
  hora_ter: Date | null;
  prog: number;
  exec: number | null;
  equipe_lm: number;
  equipe_lv: number;
  equipe_reg: number;
  chave_provisoria: boolean;
  chi: number;
  num_dp: string | null;
  tipo_servico: string | null;
  observacao_programacao: string | null;

  // Técnico
  tecnico: string | null;

  // Nota D5
  id: number;
  nota_d5: string;
  local_instalacao: string | null;
  criado_em: Date;
  conclusao_nota: Date | null;
  status_sap: string;
  tme_executado: number | null;
  tme_abertura: number | null;
  validacao_anual: boolean | null;
  mo_planejada: number;

  // Relações da nota
  municipio: string;
  regional: string;
  tipo_obra: string;
  turma: string;
  status: string;
  responsavel: string | null;

  // Obras
  ovnota: string | null;
  ordemDiagrama: string | null;
};

export type D5NoteScheduleResponse = {
  id: number;
  id_nota_d5: number;
  criado_em: Date;
  data_prog: Date;
  hora_ini: Date;
  hora_ter: Date;
  prog: number;
  exec: number;
  equipe_lm: number;
  equipe_lv: number;
  equipe_reg: number;
  chave_provisoria: boolean;
  chi: number;
  num_dp: string | null;
  tipo_servico: string | null;
  observacao_execucao: string | null;
  observacao_programacao: string | null;
  usuarioModificador: string | null;
  usuarioCriador: string | null;
  idTecnico: number;
  tecnico: string;
  idRestricao: number;
  restricao: string;
  responsavel_restricao: string | null;
  caminhos_arquivos: string[];
};
