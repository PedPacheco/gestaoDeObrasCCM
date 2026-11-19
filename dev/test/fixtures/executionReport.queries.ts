// test/fixtures/executionReport.queries.ts

import { Prisma } from 'src/infra/generated/prisma/client';

export const LARGEST_ID_CANDIDATE = 999_999_999;
export const SMALLEST_TEXT_ONLY = 1_000_000_000;

// Escrito à mão: é o contrato que o repositório deve respeitar.
// Não importe o select do código de produção.
export const makeExpectedReportSelect = () =>
  ({
    id: true,
    id_usuario: true,
    criado_em: true,
    supervisor: true,
    liberado_ligacao_parcial: true,
    hora_inicio: true,
    hora_conclusao: true,
    contato_inicio: true,
    contato_termino: true,
    atraso: true,
    justificativa_atraso: true,
    possui_equipamentos_instalados: true,
    equipamentos_aplicados: true,
    potencia_equipamento_aplicado: true,
    patrimonio_equipamento_aplicado: true,
    instalacao_equipamento_aplicado: true,
    possui_equipamentos_retirados: true,
    equipamentos_retirados: true,
    potencia_equipamento_retirado: true,
    patrimonio_equipamento_retirado: true,
    instalacao_equipamento_retirado: true,
    alteracoes_execucao: true,
    observacoes_gerais: true,
    chave_provisoria_instalada: true,
    referencia_chave_provisoria: true,
    chave_provisoria_retirada: true,
    referencia_chave_provisoria_retirada: true,
    motivo: true,
    caminho_arquivo: true,
    caminhos_arquivos: true,
    usuario: { select: { nome: true } },
    obras: {
      select: {
        ovnota: true,
        ordem_dci: true,
        tipos: { select: { tipo_obra: true } },
        status: { select: { status: true } },
      },
    },
    programacoes: {
      select: {
        data_prog: true,
        prog: true,
        exec: true,
        num_dp: true,
        hora_ini: true,
        hora_ter: true,
        chave_provisoria: true,
      },
    },
  }) satisfies Prisma.relatorio_execucaoSelect;
