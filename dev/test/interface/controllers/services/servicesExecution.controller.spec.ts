import { FinalizeServicesService } from 'src/application/usecases/services/finalizeServices.service';
import { ServicesExecutionController } from 'src/interface/controllers/services/servicesExecution.controller';
import { FinalizeServicesDTO } from 'src/interface/dtos/workServicesDTO';

import { Test, TestingModule } from '@nestjs/testing';

describe('ServicesExecutionController', () => {
  let controller: ServicesExecutionController;

  const mockFinalizeServices = {
    finalizeServices: jest.fn(),
    performServices: jest.fn(),
    reascheduleServices: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesExecutionController],
      providers: [
        { provide: FinalizeServicesService, useValue: mockFinalizeServices },
      ],
    }).compile();

    controller = module.get<ServicesExecutionController>(
      ServicesExecutionController,
    );

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('reascheduleServices', () => {
    it('should call the method reascheduleServices service', async () => {
      await controller.reascheduleServices(2, 1);

      expect(mockFinalizeServices.reascheduleServices).toHaveBeenCalledWith(
        2,
        1,
      );
    });
  });

  describe('finalizeServices', () => {
    const mockId = 10;

    const mockExecutionData = {
      data: {
        idSchedule: 123,
        executionReport: {
          supervisor: 'João da Silva',
          partialConnectionReleased: true,
          startTime: '08:30',
          finishTime: '12:45',
          startContact: 'Carlos Souza',
          endContact: 'Maria Oliveira',
          delayJustification: 'Sem atraso',
          hasEquipmentInstalled: true,
          appliedEquipment: [
            {
              equipment: 'Transformador',
              power: '75kVA',
              patrimony: 'PAT-001',
              installation: 'Poste A12',
            },
          ],
          hasEquipmentRemoved: false,
          equipmentRemoved: [],
          changesExecution: false,
          generalObservation: 'Execução OK',
          reason: 'Planejado',
          provisionalKeyInstalled: true,
          provisionalKeyReference: 'PK-123',
          provisionalKeyWithdrawn: false,
          provisionalKeyReferenceWithdrawn: '',
        },
      },
    } as FinalizeServicesDTO;

    const mockFiles = [
      {
        originalname: 'teste.pdf',
        filename: 'teste.pdf',
        path: '/uploads/teste.pdf',
        mimetype: 'application/pdf',
      },
    ] as Express.Multer.File[];

    const mockReq = {
      user: {
        sub: 99,
      },
    };

    it('should call finalizeServices service with transformed data', async () => {
      await controller.finalizeServices(
        mockId,
        mockExecutionData,
        mockFiles,
        mockReq,
      );

      const expectedExecutionReportData = {
        ...mockExecutionData.data.executionReport,
        userId: 99,
      };

      expect(mockFinalizeServices.finalizeServices).toHaveBeenCalledWith(
        mockId,
        expect.objectContaining({
          idSchedule: 123,
          userId: 99,
          executionReportData: expectedExecutionReportData,
        }),
        mockFiles,
      );
    });

    it('should call finalizeServices service with transformed data', async () => {
      await controller.finalizeServices(
        mockId,
        { data: { executionReport: undefined, idSchedule: 1 } },
        mockFiles,
        mockReq,
      );

      expect(mockFinalizeServices.finalizeServices).toHaveBeenCalledWith(
        mockId,
        expect.objectContaining({
          idSchedule: 1,
          userId: 99,
          executionReportData: undefined,
        }),
        mockFiles,
      );
    });
  });

  describe('performServices', () => {
    it('should call the method performServices service', async () => {
      const mockParams = [
        { id: 1, idSchedule: 1, qtdeRealizada: 3 },
        { id: 2, idSchedule: 2, qtdeRealizada: 4 },
      ];

      await controller.performServices(mockParams);

      expect(mockFinalizeServices.performServices).toHaveBeenCalledWith(
        mockParams,
      );
    });
  });
});
