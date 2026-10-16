import { TestingModule } from '@nestjs/testing';

import { ExportWorksInPortfolioBI } from 'src/application/usecases/export/BI/exportWorkInPortfolioBI.service';
import { ExportCompletedWorksBIService } from 'src/application/usecases/export/BI/exportCompletedWorksBI.service';
import { ExportSchedulesBIService } from 'src/application/usecases/export/BI/exportSchedulesBI.service';
import {
  assertXlsxHeaders,
  createExportTestingModule,
  makeMockResponse,
  mockProvider,
} from './export.utils';
import { ExportBIController } from 'src/interface/controllers/export/exportBi.controller';

describe('ExportBIController', () => {
  let controller: ExportBIController;

  let exportWorksInPortfolioBIService: jest.Mocked<ExportWorksInPortfolioBI>;
  let exportCompletedWorksBIService: jest.Mocked<ExportCompletedWorksBIService>;
  let exportSchedulesBIService: jest.Mocked<ExportSchedulesBIService>;

  beforeEach(async () => {
    const module: TestingModule = await createExportTestingModule(
      ExportBIController,
      [
        mockProvider(ExportWorksInPortfolioBI, ['export']),
        mockProvider(ExportCompletedWorksBIService, ['export']),
        mockProvider(ExportSchedulesBIService, ['export']),
      ],
    );

    controller = module.get(ExportBIController);
    exportWorksInPortfolioBIService = module.get(ExportWorksInPortfolioBI);
    exportCompletedWorksBIService = module.get(ExportCompletedWorksBIService);
    exportSchedulesBIService = module.get(ExportSchedulesBIService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('exportWorksInPortfolioBI (GET /obras-carteira-bi)', () => {
    it('should set xlsx headers and delegate to BI export service', async () => {
      const res = makeMockResponse();
      exportWorksInPortfolioBIService.export.mockResolvedValue(undefined);

      await controller.exportWorksInPortfolioBI(res);

      assertXlsxHeaders(res, 'Exportação obras em carteira');
      expect(exportWorksInPortfolioBIService.export).toHaveBeenCalledWith(res);
    });
  });

  describe('exportCompletedWorksBI (GET /obras-executadas-bi)', () => {
    it('should set xlsx headers and delegate to BI export service', async () => {
      const res = makeMockResponse();
      exportCompletedWorksBIService.export.mockResolvedValue(undefined);

      await controller.exportCompletedWorksBI(res);

      assertXlsxHeaders(res, 'Exportação obras executadas');
      expect(exportCompletedWorksBIService.export).toHaveBeenCalledWith(res);
    });
  });

  describe('exportSchedulesBI (GET /programacoes-bi)', () => {
    it('should set xlsx headers and delegate to BI export service', async () => {
      const res = makeMockResponse();
      exportSchedulesBIService.export.mockResolvedValue(undefined);

      await controller.exportSchedulesBI(res);

      assertXlsxHeaders(res, 'Exportação programações');
      expect(exportSchedulesBIService.export).toHaveBeenCalledWith(res);
    });
  });
});
