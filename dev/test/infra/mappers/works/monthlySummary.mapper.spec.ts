import { toContractValue } from 'src/infra/mappers/works/schedule/monthlySummary.mapper';

describe('toContractValue', () => {
  const base = { id: 1, meses: 12, id_turma: 7 };

  it('converte valor_contrato (Decimal) para number', () => {
    const result = toContractValue({
      ...base,
      valor_contrato: { toNumber: () => 1500.75 } as any,
    });

    expect(result).toEqual({ ...base, valor_contrato: 1500.75 });
  });

  it('retorna valor_contrato null quando é null', () => {
    expect(
      toContractValue({ ...base, valor_contrato: null }).valor_contrato,
    ).toBeNull();
  });

  it('retorna valor_contrato null quando é undefined', () => {
    expect(toContractValue(base).valor_contrato).toBeNull();
  });
});
