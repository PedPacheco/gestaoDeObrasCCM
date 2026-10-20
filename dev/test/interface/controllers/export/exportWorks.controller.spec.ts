import { TestingModule } from '@nestjs/testing';

import { GetWorksInPortfolioService } from 'src/application/usecases/works/management/getWorksInPortfolio.service';
import { GetCompletedWorksService } from 'src/application/usecases/works/management/getCompletedWorks.service';
import { ExportWorksInPortfolioService } from 'src/application/usecases/export/exportWorksInPortfolio.service';
import { ExportCompletedWorksService } from 'src/application/usecases/export/exportCompletedWorks.service';
import { ExportFinedWorksService } from 'src/application/usecases/export/exportFinedWorks.service';
import { ExportSuspensionsService } from 'src/application/usecases/export/exportSuspensions.service';
import { ExportRejectionsService } from 'src/application/usecases/export/exportRejections.service';
import { ExportOrdersService } from 'src/application/usecases/export/exportOrders.service';
import { ExportWorksController } from 'src/interface/controllers/export/exportWorks.controller';
import {
  assertXlsxHeaders,
  createExportTestingModule,
  makeMockResponse,
  makeReq,
  mockProvider,
} from './export.utils';
import { worksInPortfolioResponseService } from 'src/interface/types/works/getWorksInPortfolioInterface';

export const mockWorksData: worksInPortfolioResponseService = {
  works: [
    {
      ovnota: '123456',
      ordem_principal: 'OD-001',
      ordem_dcd: 'DCD-01',
      ordem_dca: 'DCA-01',
      ordem_dcim: 'DCIM-01',
      ordemdiagrama: 'OD-001',
      status_ov_sap: 50,
      pep: 'PEP001',
      mun: 'São Paulo',
      abrev_regional: 'SP',
      conjunto: 'Conjunto 1',
      circuito: 'Circuito A',
      prazo_fim: 90,
      tipo_obra: 'Manutenção Geral',
      id_grupo: 1,
      qtde_planejada: 10,
      qtde_pend: 2,
      mo_planejada: 5,
      mo_exec: 2,
      mo_pend: 3,
      status: 'Planejado',
      turma: 'Equipe Alpha',
      ano_plan: 2025,
      executado: 50,
      data_empreitamento: new Date('2024-02-20T00:00:00.000Z'),
      empreendimento: 'Empreendimento X',
      id: 0,
      prazo: 0,
      contagem_ocorrencias: 0,
      id_status: 0,
      total_equipe_lm: 1,
      total_equipe_lv: 0,
      total_equipe_reg: 0,
      total_exec: 80,
      total_pend: 20,
      total_prog: 0,
      status_prazo: 'Atenção: 23 dias restantes',
      encontrado: true,
    },
  ],
  totals: {
    total_obras: 1,
    total_mo_planejada: 5,
    total_mo_exec: 2.5,
    total_mo_pend: 0,
    total_qtde_planejada: 10,
    total_qtde_pend: 2,
  },
};

describe('ExportWorksController', () => {
  let controller: ExportWorksController;

  let getWorksInPortfolioService: jest.Mocked<GetWorksInPortfolioService>;
  let getCompletedWorksService: jest.Mocked<GetCompletedWorksService>;
  let exportWorksInPortfolioService: jest.Mocked<ExportWorksInPortfolioService>;
  let exportCompletedWorksService: jest.Mocked<ExportCompletedWorksService>;
  let exportFinedWorksService: jest.Mocked<ExportFinedWorksService>;
  let exportSuspensionsService: jest.Mocked<ExportSuspensionsService>;
  let exportRejectionsService: jest.Mocked<ExportRejectionsService>;
  let exportOrdersService: jest.Mocked<ExportOrdersService>;

  beforeEach(async () => {
    const module: TestingModule = await createExportTestingModule(
      ExportWorksController,
      [
        mockProvider(GetWorksInPortfolioService, ['getWorksInPortfolio']),
        mockProvider(GetCompletedWorksService, ['getCompletedWorks']),
        mockProvider(ExportWorksInPortfolioService, ['export']),
        mockProvider(ExportCompletedWorksService, ['export']),
        mockProvider(ExportFinedWorksService, ['export']),
        mockProvider(ExportSuspensionsService, ['export']),
        mockProvider(ExportRejectionsService, ['export']),
        mockProvider(ExportOrdersService, ['export']),
      ],
    );

    controller = module.get(ExportWorksController);
    getWorksInPortfolioService = module.get(GetWorksInPortfolioService);
    getCompletedWorksService = module.get(GetCompletedWorksService);
    exportWorksInPortfolioService = module.get(ExportWorksInPortfolioService);
    exportCompletedWorksService = module.get(ExportCompletedWorksService);
    exportFinedWorksService = module.get(ExportFinedWorksService);
    exportSuspensionsService = module.get(ExportSuspensionsService);
    exportRejectionsService = module.get(ExportRejectionsService);
    exportOrdersService = module.get(ExportOrdersService);
  });

  afterEach(() => jest.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('exportWorksInPortfolio (GET /obras-carteira)', () => {
    it('should fetch portfolio works, set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse();
      getWorksInPortfolioService.getWorksInPortfolio.mockResolvedValue(
        mockWorksData,
      );
      exportWorksInPortfolioService.export.mockResolvedValue(undefined);

      await controller.exportWorksInPortfolio(
        { page: 1 } as any,
        res,
        makeReq({ idParceira: 1 }),
      );

      expect(
        getWorksInPortfolioService.getWorksInPortfolio,
      ).toHaveBeenCalledWith(expect.objectContaining({ idParceira: 1 }));
      assertXlsxHeaders(res, 'Exportação obras em carteira');
      expect(exportWorksInPortfolioService.export).toHaveBeenCalledWith(
        mockWorksData,
        res,
      );
    });

    it('should apply partner permission filters for a PARCEIRA user', async () => {
      const res = makeMockResponse();
      getWorksInPortfolioService.getWorksInPortfolio.mockResolvedValue(
        mockWorksData,
      );
      exportWorksInPortfolioService.export.mockResolvedValue(undefined);

      await controller.exportWorksInPortfolio(
        { page: 1 } as any,
        res,
        makeReq({ idParceira: 7, user: { tipo_usuario: 'PARCEIRA' } }),
      );

      expect(
        getWorksInPortfolioService.getWorksInPortfolio,
      ).toHaveBeenCalledWith({
        page: 1,
        idParceira: 7,
        insufficientPermission: true,
      });
    });
  });

  describe('exportCompletedWorks (GET /obras-executadas)', () => {
    it('should fetch completed works, set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse();
      getCompletedWorksService.getCompletedWorks.mockResolvedValue(
        mockWorksData,
      );
      exportCompletedWorksService.export.mockResolvedValue(undefined);

      await controller.exportCompletedWorks(
        { idRegional: [2] } as any,
        res,
        makeReq({ idParceira: 5, user: { tipo_usuario: 'PARCEIRA' } }),
      );

      expect(getCompletedWorksService.getCompletedWorks).toHaveBeenCalledWith(
        expect.objectContaining({
          idParceira: 5,
          insufficientPermission: true,
        }),
      );
      assertXlsxHeaders(res, 'Exportação obras executadas');
      expect(exportCompletedWorksService.export).toHaveBeenCalledWith(
        mockWorksData,
        res,
      );
    });

    it('should not add partner filters for an INTERNO user without idParceira', async () => {
      const res = makeMockResponse();
      getCompletedWorksService.getCompletedWorks.mockResolvedValue(
        mockWorksData,
      );
      exportCompletedWorksService.export.mockResolvedValue(undefined);

      await controller.exportCompletedWorks(
        { idRegional: [2] } as any,
        res,
        makeReq(),
      );

      expect(getCompletedWorksService.getCompletedWorks).toHaveBeenCalledWith({
        idRegional: [2],
      });
    });
  });

  describe('exportFinedWorks (GET /obras-multas)', () => {
    it('should set xlsx headers and forward date range to export service', async () => {
      const res = makeMockResponse();
      exportFinedWorksService.export.mockResolvedValue(undefined);

      await controller.exportFinedWorks(res, '2025-01-01', '2025-01-31');

      assertXlsxHeaders(res, 'Exportação a serem multadas');
      expect(exportFinedWorksService.export).toHaveBeenCalledWith(
        res,
        '2025-01-01',
        '2025-01-31',
      );
    });

    it('should work when startDate and endDate are omitted', async () => {
      const res = makeMockResponse();
      exportFinedWorksService.export.mockResolvedValue(undefined);

      await controller.exportFinedWorks(res);

      expect(exportFinedWorksService.export).toHaveBeenCalledWith(
        res,
        undefined,
        undefined,
      );
    });
  });

  describe('exportSuspensions (GET /suspensoes)', () => {
    it('should set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse();
      exportSuspensionsService.export.mockResolvedValue(undefined);

      await controller.exportSuspensions(res);

      assertXlsxHeaders(res, 'Exportação Suspensões');
      expect(exportSuspensionsService.export).toHaveBeenCalledWith(res);
    });
  });

  describe('exportRejections (GET /reprovacoes)', () => {
    it('should set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse();
      exportRejectionsService.export.mockResolvedValue(undefined);

      await controller.exportRejections(res);

      assertXlsxHeaders(res, 'Exportação das reprovações');
      expect(exportRejectionsService.export).toHaveBeenCalledWith(res);
    });
  });

  describe('exportOrders (GET /ordens)', () => {
    it('should set xlsx headers and delegate to export service', async () => {
      const res = makeMockResponse();
      exportOrdersService.export.mockResolvedValue(undefined);

      await controller.exportOrders(res);

      assertXlsxHeaders(res, 'Exportação Ordens/Diagramas');
      expect(exportOrdersService.export).toHaveBeenCalledWith(res);
    });
  });
});
