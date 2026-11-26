import { toNumberPreco } from 'src/infra/shared/decimalMapper';

describe('toNumberPreco', () => {
  it('converte preco de Decimal para number', () => {
    const result = toNumberPreco({ preco: { toNumber: () => 12.5 } as any });

    expect(result.preco).toBe(12.5);
  });

  it('preserva as demais propriedades', () => {
    const result = toNumberPreco({
      id: 1,
      nome: 'Material',
      preco: { toNumber: () => 3 } as any,
    });

    expect(result).toEqual({ id: 1, nome: 'Material', preco: 3 });
  });

  it('não altera o objeto original', () => {
    const input = { preco: { toNumber: () => 1 } as any };

    toNumberPreco(input);

    expect(typeof input.preco.toNumber).toBe('function');
  });
});
