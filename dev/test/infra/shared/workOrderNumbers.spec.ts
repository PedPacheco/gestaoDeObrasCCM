import {
  toWorkOrderNumbers,
  WORK_ORDER_NUMBERS_SELECT,
} from 'src/infra/shared/workOrderNumbers';

describe('workOrderNumbers', () => {
  describe('WORK_ORDER_NUMBERS_SELECT', () => {
    it('seleciona os campos de ordem esperados', () => {
      expect(WORK_ORDER_NUMBERS_SELECT).toEqual({
        ovnota: true,
        diagrama: true,
        ordem_dci: true,
        ordem_dca: true,
        ordem_dcd: true,
        ordem_dcim: true,
      });
    });
  });

  describe('toWorkOrderNumbers', () => {
    const row = {
      ovnota: 'OV1',
      diagrama: 'DG1',
      ordem_dci: 'CI1',
      ordem_dca: 'CA1',
      ordem_dcd: 'CD1',
      ordem_dcim: 'CIM1',
    };

    it('mapeia os campos do banco para o domínio', () => {
      expect(toWorkOrderNumbers({ ...row, ordem_dcdm: 'CDM1' })).toEqual({
        ovnota: 'OV1',
        diagram: 'DG1',
        dciOrder: 'CI1',
        dcaOrder: 'CA1',
        dcdOrder: 'CD1',
        dcimOrder: 'CIM1',
        dcdmOrder: 'CDM1',
      });
    });

    it('usa null em dcdmOrder quando ordem_dcdm é undefined', () => {
      expect(toWorkOrderNumbers(row).dcdmOrder).toBeNull();
    });

    it('usa null em dcdmOrder quando ordem_dcdm é null', () => {
      expect(
        toWorkOrderNumbers({ ...row, ordem_dcdm: null }).dcdmOrder,
      ).toBeNull();
    });
  });
});
