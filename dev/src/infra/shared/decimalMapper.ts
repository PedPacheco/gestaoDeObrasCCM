import type { Prisma } from 'src/infra/generated/prisma/client';

/** Objeto com preco em Decimal, como o Prisma devolve. */
export type DecimalPreco = { preco: Prisma.Decimal };

/** O mesmo objeto com preco convertido para number (formato do domínio). */
export type NumberPreco<T extends DecimalPreco> = Omit<T, 'preco'> & {
  preco: number;
};

/** Converte preco para number. */
export function toNumberPreco<T extends DecimalPreco>(m: T): NumberPreco<T> {
  // o cast é necessário porque o TS não simplifica o spread de um tipo genérico
  return { ...m, preco: m.preco.toNumber() } as NumberPreco<T>;
}
