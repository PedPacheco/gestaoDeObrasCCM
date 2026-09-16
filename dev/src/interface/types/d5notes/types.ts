import { Decimal } from '@prisma/client/runtime/library';

export type D5NoteResult = {
  id: number;
  local_instalacao: string | null;
  criado_em: Date;
  conclusao_nota: Date | null;
  status: string;
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
  novo_tabela_usuarios: {
    nome: string;
  } | null;
};
