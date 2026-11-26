import type { GetContractValueResponse } from 'src/domain/types';
import { Prisma } from 'src/infra/generated/prisma/client';

export type ContractValueRow = {
  id: number;
  meses: number;
  id_turma: number;
  valor_contrato?: Prisma.Decimal | null;
};

export function toContractValue(
  row: ContractValueRow,
): GetContractValueResponse {
  return {
    id: row.id,
    meses: row.meses,
    id_turma: row.id_turma,
    valor_contrato: row.valor_contrato?.toNumber() ?? null,
  };
}
