import { toNumberOrNull } from 'src/utils/toNumberToNull';

describe('toNumberOrNull', () => {
  it('retorna null quando o valor é null', () => {
    expect(toNumberOrNull(null)).toBeNull();
  });

  it('retorna o próprio número', () => {
    expect(toNumberOrNull(10.5)).toBe(10.5);
    expect(toNumberOrNull(0)).toBe(0);
  });

  it('converte objetos com toString numérico (ex.: Decimal)', () => {
    expect(toNumberOrNull({ toString: () => '42.5' })).toBe(42.5);
  });
});
