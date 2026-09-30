import { TestingModule } from '@nestjs/testing';

import { FeasibilityService } from 'src/application/usecases/feasibility.service';
import { ExportFeasibilityService } from 'src/application/usecases/export/exportFeasibility.service';
import { ExportFeasibilityController } from 'src/interface/controllers/export/exportFeasibility.controller';
import {
  assertXlsxHeaders,
  createExportTestingModule,
  makeMockResponse,
  mockProvider,
} from './export.utils';

describe('ExportFeasibilityController', () => {
  let controller: ExportFeasibilityController;

  let feasibilityService: jest.Mocked<FeasibilityService>;
  let exportFeasibilityService: jest.Mocked<ExportFeasibilityService>;

  beforeEach(async () => {
    const module: TestingModule = await createExportTestingModule(
      ExportFeasibilityController,
      [
        mockProvider(FeasibilityService, [
          'exportFeasibilityPendingApproval',
          'exportFeasibilityPending',
        ]),
        mockProvider(ExportFeasibilityService, [
          'exportFeasibilityPendingApproval',
          'exportFeasibilityPending',
        ]),
      ],
    );

    controller = module.get(ExportFeasibilityController);
    feasibilityService = module.get(FeasibilityService);
    exportFeasibilityService = module.get(ExportFeasibilityService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('exportFeasibilityPendingApproval (GET /viabilidade/aguardando-aprovacao)', () => {
    it('should fetch feasibility, set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse();
      feasibilityService.exportFeasibilityPendingApproval.mockResolvedValue([]);

      await controller.exportFeasibilityPendingApproval(res, {
        idPartner: [2],
      } as any);

      expect(
        feasibilityService.exportFeasibilityPendingApproval,
      ).toHaveBeenCalledWith([2]);
      assertXlsxHeaders(res, 'Exportação Viabilidade Aguardando Aprovação');
      expect(
        exportFeasibilityService.exportFeasibilityPendingApproval,
      ).toHaveBeenCalledWith([], res);
    });
  });

  describe('exportFeasibilityPending (GET /viabilidade/aguardando-viabilidade)', () => {
    it('should fetch feasibility, set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse();
      feasibilityService.exportFeasibilityPending.mockResolvedValue([]);

      await controller.exportFeasibilityPending(res, { idPartner: [2] } as any);

      expect(feasibilityService.exportFeasibilityPending).toHaveBeenCalledWith([
        2,
      ]);
      assertXlsxHeaders(res, 'Exportação Viabilidade Pendente');
      expect(
        exportFeasibilityService.exportFeasibilityPending,
      ).toHaveBeenCalledWith([], res);
    });
  });
});
