import {
  applyPartnerFilters,
  setPdfHeaders,
  setXlsxHeaders,
} from 'src/interface/controllers/export/export.helpers';
import {
  assertPdfHeaders,
  assertXlsxHeaders,
  makeMockResponse,
  makeReq,
} from './export.utils';

describe('export.helpers', () => {
  describe('applyPartnerFilters', () => {
    it('should inject idParceira from req into filters when present', () => {
      const result = applyPartnerFilters(
        { page: 1 } as any,
        makeReq({ idParceira: 42 }),
      );

      expect(result).toEqual(
        expect.objectContaining({ page: 1, idParceira: 42 }),
      );
    });

    it('should NOT inject idParceira when req has no idParceira', () => {
      const result = applyPartnerFilters({ page: 1 } as any, makeReq());

      expect(result).not.toHaveProperty('idParceira');
    });

    it('should set insufficientPermission to true when user is PARCEIRA', () => {
      const result = applyPartnerFilters(
        { page: 1 } as any,
        makeReq({ user: { tipo_usuario: 'PARCEIRA' } }),
      );

      expect(result).toEqual(
        expect.objectContaining({ insufficientPermission: true }),
      );
    });

    it('should NOT set insufficientPermission when user is INTERNO', () => {
      const result = applyPartnerFilters(
        { page: 1 } as any,
        makeReq({ user: { tipo_usuario: 'INTERNO' } }),
      );

      expect(result).not.toHaveProperty('insufficientPermission');
    });

    it('should apply both idParceira and insufficientPermission for a PARCEIRA user with idParceira', () => {
      const result = applyPartnerFilters(
        { page: 1 } as any,
        makeReq({ idParceira: 7, user: { tipo_usuario: 'PARCEIRA' } }),
      );

      expect(result).toEqual({
        page: 1,
        idParceira: 7,
        insufficientPermission: true,
      });
    });

    it('should leave filters untouched for an INTERNO user without idParceira', () => {
      const result = applyPartnerFilters({ page: 1 } as any, makeReq());

      expect(result).toEqual({ page: 1 });
    });
  });

  describe('setXlsxHeaders', () => {
    it('should set Content-Disposition and the xlsx Content-Type', () => {
      const res = makeMockResponse();

      setXlsxHeaders(res, 'Exportação Teste');

      assertXlsxHeaders(res, 'Exportação Teste');
    });
  });

  describe('setPdfHeaders', () => {
    it('should set Content-Disposition with .pdf extension and the pdf Content-Type', () => {
      const res = makeMockResponse();

      setPdfHeaders(res, 'Relatório');

      assertPdfHeaders(res, 'Relatório');
    });
  });
});
