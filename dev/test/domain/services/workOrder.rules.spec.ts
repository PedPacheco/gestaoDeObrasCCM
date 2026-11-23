import { resolveOrdemDiagrama } from 'src/domain/services/workOrder.rules';
import { WorkOrderNumbers } from 'src/domain/types/shared/workOrder.types';

const empty: WorkOrderNumbers = {
  ovnota: null,
  diagram: null,
  dciOrder: null,
  dcaOrder: null,
  dcdOrder: null,
  dcimOrder: null,
  dcdmOrder: null,
};

describe('resolveOrdemDiagrama', () => {
  it('retorna null quando nenhum número está preenchido', () => {
    expect(resolveOrdemDiagrama(empty)).toBeNull();
  });

  it('retorna null quando a obra é undefined/null', () => {
    expect(resolveOrdemDiagrama(undefined as any)).toBeNull();
    expect(resolveOrdemDiagrama(null as any)).toBeNull();
  });

  it('prioriza o diagrama sobre as demais ordens', () => {
    expect(
      resolveOrdemDiagrama({ ...empty, diagram: 'D1', dciOrder: 'CI1' }),
    ).toBe('D1');
  });

  it.each([
    ['dciOrder', 'CI1'],
    ['dcaOrder', 'CA1'],
    ['dcdOrder', 'CD1'],
    ['dcimOrder', 'CIM1'],
    ['dcdmOrder', 'CDM1'],
  ] as const)('usa %s quando as anteriores estão vazias', (field, value) => {
    expect(resolveOrdemDiagrama({ ...empty, [field]: value })).toBe(value);
  });

  it('respeita a ordem de prioridade dci > dca > dcd > dcim > dcdm', () => {
    expect(
      resolveOrdemDiagrama({
        ...empty,
        dcaOrder: 'CA1',
        dcdOrder: 'CD1',
        dcimOrder: 'CIM1',
        dcdmOrder: 'CDM1',
      }),
    ).toBe('CA1');
  });
});
