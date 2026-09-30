import { NotFoundException } from '@nestjs/common';
import { TestingModule } from '@nestjs/testing';

import { ExportServicesService } from 'src/application/usecases/services/exportServices.service';
import {
  ExportPdfServicesService,
  ExportServicesPdfOutput,
} from 'src/application/usecases/export/services/exportPdfServices.service';
import { ExportExcelServicesService } from 'src/application/usecases/export/services/exportExcelServices.service';
import { ExportServicesExcelOutput } from 'src/interface/types/servicesInterface';
import { ExportServicesController } from 'src/interface/controllers/export/exportServices.controller';
import {
  assertPdfHeaders,
  assertXlsxHeaders,
  createExportTestingModule,
  makeMockResponse,
  makeReq,
  mockProvider,
} from './export.utils';

describe('ExportServicesController', () => {
  let controller: ExportServicesController;

  let exportServicesService: jest.Mocked<ExportServicesService>;
  let exportPdfServicesService: jest.Mocked<ExportPdfServicesService>;
  let exportExcelServicesService: jest.Mocked<ExportExcelServicesService>;

  // Factory (e não const compartilhada): o controller muta os filtros.
  const makeFilters = (overrides: Record<string, unknown> = {}) =>
    ({
      dataInicial: '20/05/2026',
      dataFinal: '22/05/2026',
      idParceira: 2,
      idEquipe: ['LV01'],
      fileType: 'pdf',
      ...overrides,
    }) as any;

  beforeEach(async () => {
    const module: TestingModule = await createExportTestingModule(
      ExportServicesController,
      [
        mockProvider(ExportServicesService, ['getServicesToExportation']),
        mockProvider(ExportPdfServicesService, ['export']),
        mockProvider(ExportExcelServicesService, ['export']),
      ],
    );

    controller = module.get(ExportServicesController);
    exportServicesService = module.get(ExportServicesService);
    exportPdfServicesService = module.get(ExportPdfServicesService);
    exportExcelServicesService = module.get(ExportExcelServicesService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('exportServices (GET /servicos)', () => {
    it('should fetch services, set pdf headers and delegate to the pdf export service', async () => {
      const res = makeMockResponse();
      const data = [{} as ExportServicesPdfOutput];
      exportServicesService.getServicesToExportation.mockResolvedValue(data);
      exportPdfServicesService.export.mockResolvedValue(undefined);

      await controller.exportServices(
        makeFilters(),
        res,
        makeReq({ idParceira: 5 }),
      );

      expect(
        exportServicesService.getServicesToExportation,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          idParceira: 5,
          dataInicial: '20/05/2026',
          dataFinal: '22/05/2026',
          idEquipe: ['LV01'],
          fileType: 'pdf',
        }),
      );
      assertPdfHeaders(res, 'Exportacao Serviços e Materiais');
      expect(exportPdfServicesService.export).toHaveBeenCalledWith(data, res);
      expect(exportExcelServicesService.export).not.toHaveBeenCalled();
    });

    it('should fetch services, set xlsx headers and delegate to the excel export service (INTERNO)', async () => {
      const res = makeMockResponse();
      const data = [{} as ExportServicesExcelOutput];
      exportServicesService.getServicesToExportation.mockResolvedValue(data);
      exportExcelServicesService.export.mockResolvedValue(undefined);

      await controller.exportServices(
        makeFilters({ fileType: 'excel' }),
        res,
        makeReq({ idParceira: 5, user: { tipo_usuario: 'INTERNO' } }),
      );

      expect(
        exportServicesService.getServicesToExportation,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ idParceira: 5, fileType: 'excel' }),
      );
      assertXlsxHeaders(res, 'Exportacao Serviços e Materiais');
      expect(exportExcelServicesService.export).toHaveBeenCalledWith(
        data,
        res,
        true,
      );
      expect(exportPdfServicesService.export).not.toHaveBeenCalled();
    });

    it('should export excel with isInternal=false and insufficientPermission for a PARCEIRA user', async () => {
      const res = makeMockResponse();
      const data = [{} as ExportServicesExcelOutput];
      exportServicesService.getServicesToExportation.mockResolvedValue(data);
      exportExcelServicesService.export.mockResolvedValue(undefined);

      await controller.exportServices(
        makeFilters({ fileType: 'excel' }),
        res,
        makeReq({ idParceira: 5, user: { tipo_usuario: 'PARCEIRA' } }),
      );

      expect(
        exportServicesService.getServicesToExportation,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          idParceira: 5,
          insufficientPermission: true,
        }),
      );
      expect(exportExcelServicesService.export).toHaveBeenCalledWith(
        data,
        res,
        false,
      );
    });

    it('should throw NotFoundException and not touch the response when no data is returned', async () => {
      const res = makeMockResponse();
      exportServicesService.getServicesToExportation.mockResolvedValue([]);

      await expect(
        controller.exportServices(
          makeFilters({ fileType: 'excel' }),
          res,
          makeReq({ idParceira: 5 }),
        ),
      ).rejects.toThrow(NotFoundException);

      expect(exportExcelServicesService.export).not.toHaveBeenCalled();
      expect(exportPdfServicesService.export).not.toHaveBeenCalled();
      expect(res.setHeader).not.toHaveBeenCalled();
    });
  });
});
