import { ConflictException } from '@nestjs/common';
import { Prisma } from 'src/infra/generated/prisma/client';
import { PONTO_A_PONTO_PARTNER_ID } from 'src/utils/pointByPoint/serviceType.utils';

/**
 * O modelo de programação da obra (`programacao_ponto_a_ponto`) é derivado da
 * parceira (`id_turma`) e só era gravado na inserção. Ao trocar a parceira, o
 * flag precisa acompanhar — senão a obra passa a usar o fluxo errado (regra 5).
 *
 * Retorna o novo valor do flag (ou `undefined` quando a parceira não muda/não
 * foi informada). Trocar o modelo de uma obra que já tem programações é
 * bloqueado: os itens, contratos e equipes pertencem ao modelo anterior.
 */
export async function resolvePointByPointMode(
  client: Pick<Prisma.TransactionClient, 'obras' | 'programacoes'>,
  workId: number,
  newPartnerId?: number | null,
): Promise<boolean | undefined> {
  if (newPartnerId === undefined || newPartnerId === null) return undefined;

  const nextMode = Number(newPartnerId) === PONTO_A_PONTO_PARTNER_ID;

  const work = await client.obras.findUnique({
    where: { id: workId },
    select: { programacao_ponto_a_ponto: true },
  });

  if (!work) return undefined;

  if (Boolean(work.programacao_ponto_a_ponto) === nextMode) return nextMode;

  const schedules = await client.programacoes.count({
    where: { id_obra: workId },
  });

  if (schedules > 0) {
    throw new ConflictException(
      'Não é possível trocar para uma parceira de outro modelo de programação (ponto a ponto / tradicional) em uma obra que já possui programações.',
    );
  }

  return nextMode;
}
