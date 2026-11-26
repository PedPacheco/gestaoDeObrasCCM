import { WorkOrderNumbers } from 'src/domain/types/shared/workOrder.types';
import { Prisma } from '../generated/prisma/client';

export const WORK_ORDER_NUMBERS_SELECT = {
  ovnota: true,
  diagrama: true,
  ordem_dci: true,
  ordem_dca: true,
  ordem_dcd: true,
  ordem_dcim: true,
  // ordem_dcdm: true  → no commit "fix(obras): inclui ordem_dcdm"
} satisfies Prisma.obrasSelect;

export type WorkOrderNumbersRow = Prisma.obrasGetPayload<{
  select: typeof WORK_ORDER_NUMBERS_SELECT;
}>;

export const toWorkOrderNumbers = (
  r: WorkOrderNumbersRow & { ordem_dcdm?: string | null },
): WorkOrderNumbers => ({
  ovnota: r.ovnota,
  diagram: r.diagrama,
  dciOrder: r.ordem_dci,
  dcaOrder: r.ordem_dca,
  dcdOrder: r.ordem_dcd,
  dcimOrder: r.ordem_dcim,
  dcdmOrder: r.ordem_dcdm ?? null,
});
