import {
  Prisma,
  relatorio_viabilidade,
} from 'src/infra/generated/prisma/client';

/** Model completo: o findByWorkIdentifier (antigo exists) não usa select. */
export type FeasibilityReportRow = relatorio_viabilidade;

export const FEASIBILITY_FILES_SELECT = {
  id: true,
  caminhos_arquivos: true,
  arquivos_complementares: true,
} satisfies Prisma.relatorio_viabilidadeSelect;

export type FeasibilityFilesRow = Prisma.relatorio_viabilidadeGetPayload<{
  select: typeof FEASIBILITY_FILES_SELECT;
}>;

export const FEASIBILITY_REJECTION_SELECT = {
  descricao: true,
  motivo: true,
  criado_em: true,
  novo_tabela_usuarios: { select: { nome: true } },
} satisfies Prisma.reprovacoes_viabilidadeSelect;

export type FeasibilityRejectionRow = Prisma.reprovacoes_viabilidadeGetPayload<{
  select: typeof FEASIBILITY_REJECTION_SELECT;
}>;

export const FEASIBILITY_EXPORT_SELECT = {
  ovnota: true,
  diagrama: true,
  ordem_dci: true,
  ordem_dca: true,
  ordem_dcd: true,
  ordem_dcim: true,
  relatorio_viabilidade: { select: { data_envio: true } },
  servicos: {
    select: {
      operacao: true,
      ponto: true,
      qtde_plan: true,
      viabilizado: true,
      descricao_operacao: true,
      numero_operacao: true,
      materiais: { select: { codigo: true, descricao: true, preco: true } },
      servicos_contratos: {
        select: { material: true, texto_breve: true, preco: true },
      },
    },
  },
} satisfies Prisma.obrasSelect;

export type FeasibilityExportRow = Prisma.obrasGetPayload<{
  select: typeof FEASIBILITY_EXPORT_SELECT;
}>;
export type FeasibilityExportServiceRow =
  FeasibilityExportRow['servicos'][number];

/** Valor gravado em prazo_viabilidade quando a viabilidade é reprovada. */
export const FEASIBILITY_MISSING_STATUS = 'FALTA VIABILIDADE';
