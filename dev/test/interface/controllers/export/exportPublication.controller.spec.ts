import { TestingModule } from '@nestjs/testing';

import { RestrictionsService } from 'src/application/usecases/restrictions.service';
import { ExportPublicationRestrictionService } from 'src/application/usecases/export/exportPublicationRestriction.service';
import { ExportReportToPubliationService } from 'src/application/usecases/export/exportReportToPublication.service';
import {
  assertXlsxHeaders,
  createExportTestingModule,
  makeMockResponse,
  makeReq,
  mockProvider,
} from './export.utils';
import { ExportPublicationsController } from 'src/interface/controllers/export/exportPublication.controller';

describe('ExportPublicationsController', () => {
  let controller: ExportPublicationsController;

  let restrictionsService: jest.Mocked<RestrictionsService>;
  let exportPublicationRestrictionService: jest.Mocked<ExportPublicationRestrictionService>;
  let exportReportToPublicationService: jest.Mocked<ExportReportToPubliationService>;

  beforeEach(async () => {
    const module: TestingModule = await createExportTestingModule(
      ExportPublicationsController,
      [
        mockProvider(RestrictionsService, ['getPublicationRestriction']),
        mockProvider(ExportPublicationRestrictionService, ['export']),
        mockProvider(ExportReportToPubliationService, ['export']),
      ],
    );

    controller = module.get(ExportPublicationsController);
    restrictionsService = module.get(RestrictionsService);
    exportPublicationRestrictionService = module.get(
      ExportPublicationRestrictionService,
    );
    exportReportToPublicationService = module.get(
      ExportReportToPubliationService,
    );
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('exportPublicationRestrictions (GET /publicacoes)', () => {
    it('should fetch publication restrictions, set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse();
      restrictionsService.getPublicationRestriction.mockResolvedValue({
        works: [],
      });
      exportPublicationRestrictionService.export.mockResolvedValue(undefined);

      await controller.exportPublicationRestrictions(
        { idRegional: [2] } as any,
        res,
        makeReq({ idParceira: 5, user: { tipo_usuario: 'PARCEIRA' } }),
      );

      expect(
        restrictionsService.getPublicationRestriction,
      ).toHaveBeenCalledWith(
        expect.objectContaining({
          idParceira: 5,
          insufficientPermission: true,
        }),
      );
      assertXlsxHeaders(res, 'Exportação Restrições de Publicação');
      expect(exportPublicationRestrictionService.export).toHaveBeenCalledWith(
        { works: [] },
        res,
      );
    });

    it('should not add partner filters for an INTERNO user without idParceira', async () => {
      const res = makeMockResponse();
      restrictionsService.getPublicationRestriction.mockResolvedValue({
        works: [],
      });
      exportPublicationRestrictionService.export.mockResolvedValue(undefined);

      await controller.exportPublicationRestrictions(
        { idRegional: [2] } as any,
        res,
        makeReq(),
      );

      expect(
        restrictionsService.getPublicationRestriction,
      ).toHaveBeenCalledWith({ idRegional: [2] });
    });
  });

  describe('exportReportToPublication (GET /relatorio-publicacoes)', () => {
    it('should set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse();
      exportReportToPublicationService.export.mockResolvedValue(undefined);

      await controller.exportReportToPublication(res);

      assertXlsxHeaders(res, 'Exportação Relatório Publicações ');
      expect(exportReportToPublicationService.export).toHaveBeenCalledWith(res);
    });
  });
});
