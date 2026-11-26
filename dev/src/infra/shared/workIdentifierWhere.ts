import { Prisma } from '../generated/prisma/client';

export const workIdentifierWhere = (
  identifier: number,
): Prisma.obrasWhereInput => {
  const value = identifier.toString();
  return {
    OR: [
      { id: value.length >= 10 ? undefined : identifier },
      { ovnota: value },
      { ordem_dci: value },
      { ordem_dcd: value },
      { ordem_dca: value },
      { ordem_dcim: value },
      { diagrama: value },
    ],
  };
};
