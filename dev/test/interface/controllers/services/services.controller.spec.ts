import { Test, TestingModule } from '@nestjs/testing';
import { HttpStatus } from '@nestjs/common';

import { ServicesController } from 'src/interface/controllers/services/worksServices.controller';
import { ScheduleServicesDTO } from 'src/interface/dtos/workServicesDTO';

import { WorksServicesService } from 'src/application/usecases/services/worksServices.service';

import { ImportServicesSpreadsheetService } from 'src/application/usecases/services/importServicesSpreadsheet.service';

describe('ServicesController', () => {
  let controller: ServicesController;
  let service: WorksServicesService;

  const mockWorksServicesService = {
    scheduleServices: jest.fn(),
    reascheduleServices: jest.fn(),
    applyAdditional: jest.fn(),
    cancelServices: jest.fn(),
    addItem: jest.fn(),
    delete: jest.fn(),
    deleteAll: jest.fn(),
    importFromSpreadsheet: jest.fn(),
  };

  const mockImportServicesService = {
    importFromSpreadsheet: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ServicesController],
      providers: [
        {
          provide: WorksServicesService,
          useValue: mockWorksServicesService,
        },
        {
          provide: ImportServicesSpreadsheetService,
          useValue: mockImportServicesService,
        },
      ],
    }).compile();

    controller = module.get<ServicesController>(ServicesController);
    service = module.get<WorksServicesService>(WorksServicesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('applyAdditional', () => {
    it('should call service method correctly', async () => {
      const mockData = [{ id: 1, additional: 3 }];

      mockWorksServicesService.applyAdditional.mockResolvedValue(undefined);

      const result = await controller.applyAdditional(4, mockData);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Aplicado adicional no serviço',
      });
      expect(service.applyAdditional).toHaveBeenCalledWith(4, mockData);
    });
  });

  describe('scheduleServices', () => {
    it('should schedule services successfully', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [
        {
          id: 1,
          idTeam: 10,
          prog: 100,
          operation: 'instalação',
          point: 'p1',
          type: 'M',
        },
        {
          id: 2,
          idTeam: 20,
          prog: 200,
          operation: 'instalação',
          point: 'p1',
          type: 'S',
        },
      ];

      mockWorksServicesService.scheduleServices.mockResolvedValue(undefined);

      const result = await controller.scheduleServices(1, mockScheduleData);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Serviços programados com sucesso',
      });
      expect(service.scheduleServices).toHaveBeenCalledWith(
        1,
        mockScheduleData,
      );
      expect(service.scheduleServices).toHaveBeenCalledTimes(1);
    });

    it('should schedule services with optional idSchedule', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [
        {
          id: 1,
          idTeam: 10,
          idSchedule: 5,
          prog: 100,
          operation: 'instalação',
          point: 'p1',
          type: 'S',
        },
        {
          id: 2,
          idTeam: 20,
          prog: 200,
          operation: 'instalação',
          point: 'p1',
          type: 'M',
        },
      ];

      mockWorksServicesService.scheduleServices.mockResolvedValue(undefined);

      const result = await controller.scheduleServices(1, mockScheduleData);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Serviços programados com sucesso',
      });
      expect(service.scheduleServices).toHaveBeenCalledWith(
        1,
        mockScheduleData,
      );
      expect(service.scheduleServices).toHaveBeenCalledTimes(1);
    });

    it('should schedule single service', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [
        {
          id: 1,
          idTeam: 10,
          prog: 100,
          operation: 'instalação',
          point: 'p1',
          type: 'S',
        },
      ];

      mockWorksServicesService.scheduleServices.mockResolvedValue(undefined);

      const result = await controller.scheduleServices(1, mockScheduleData);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(service.scheduleServices).toHaveBeenCalledWith(
        1,
        mockScheduleData,
      );
    });

    it('should handle empty schedule array', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [];

      mockWorksServicesService.scheduleServices.mockResolvedValue(undefined);

      const result = await controller.scheduleServices(1, mockScheduleData);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(service.scheduleServices).toHaveBeenCalledWith(1, []);
    });

    it('should schedule services with all fields populated', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [
        {
          id: 1,
          idTeam: 10,
          idSchedule: 5,
          prog: 100,
          operation: 'instalação',
          point: 'p1',
          type: 'M',
        },
        {
          id: 2,
          idTeam: 20,
          idSchedule: 6,
          prog: 200,
          operation: 'instalação',
          point: 'p1',
          type: 'S',
        },
        {
          id: 3,
          idTeam: 30,
          idSchedule: 7,
          prog: 300,
          operation: 'instalação',
          point: 'p1',
          type: 'S',
        },
      ];

      mockWorksServicesService.scheduleServices.mockResolvedValue(undefined);

      const result = await controller.scheduleServices(1, mockScheduleData);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Serviços programados com sucesso',
      });
      expect(service.scheduleServices).toHaveBeenCalledWith(
        1,
        mockScheduleData,
      );
    });
  });

  describe('addServices', () => {
    it('should call the method addServices service', async () => {
      const mockParam = {
        idWork: 1,
        idService: 2,
        point: 'P1',
        operation: 'INSTALAÇÃO',
        operationDescription: 'POSTE - ODI',
        operationNumber: '2000',
        quantity: 2,
      };

      await controller.addServices(mockParam);

      expect(mockWorksServicesService.addItem).toHaveBeenCalledWith(
        mockParam,
        'service',
      );
    });
  });

  describe('addMaterials', () => {
    it('should call the method addMaterials service', async () => {
      const mockParam = {
        idWork: 1,
        idService: 2,
        point: 'P1',
        operation: 'INSTALAÇÃO',
        operationDescription: 'POSTE - ODI',
        operationNumber: '2000',
        quantity: 2,
      };

      await controller.addMaterials(mockParam);

      expect(mockWorksServicesService.addItem).toHaveBeenCalledWith(
        mockParam,
        'material',
      );
    });
  });

  describe('addFamily', () => {
    it('should call the method addFamily with service', async () => {
      const mockParam = {
        idWork: 1,
        idService: 2,
        point: 'P1',
        operation: 'INSTALAÇÃO',
        operationDescription: 'POSTE - ODI',
        quantity: 2,
        type: 'S' as any,
      };

      const dataSent = {
        idWork: 1,
        idService: 2,
        point: 'P1',
        operation: 'INSTALAÇÃO',
        operationDescription: 'POSTE - ODI',
        quantity: 2,
        type: 'S',
      };

      await controller.addFamily(mockParam);

      expect(mockWorksServicesService.addItem).toHaveBeenCalledWith(
        dataSent,
        'service',
      );
    });

    it('should call the method addFamily with material', async () => {
      const mockParam = {
        idWork: 1,
        idService: 2,
        point: 'P1',
        operation: 'INSTALAÇÃO',
        operationDescription: 'POSTE - ODI',
        quantity: 2,
        type: 'M' as any,
      };

      const dataSent = {
        idWork: 1,
        idService: 2,
        point: 'P1',
        operation: 'INSTALAÇÃO',
        operationDescription: 'POSTE - ODI',
        quantity: 2,
        type: 'M',
      };

      await controller.addFamily(mockParam);

      expect(mockWorksServicesService.addItem).toHaveBeenCalledWith(
        dataSent,
        'material',
      );
    });
  });

  describe('deleteMaterialAndService', () => {
    it('Should call deleteSchedules and return message', async () => {
      jest.spyOn(service, 'delete').mockResolvedValue();

      const result = await controller.deleteMaterialAndService(1, 4);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Serviço/Material excluído com sucesso',
      });
      expect(service.delete).toHaveBeenCalledWith(1, 4);
    });
  });

  describe('deleteAllServices', () => {
    it('Should call delete all services and materials and return message', async () => {
      jest.spyOn(service, 'deleteAll').mockResolvedValue();

      const result = await controller.deleteAllServices(1);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Serviços/Materiais excluídos com sucesso',
      });
      expect(service.deleteAll).toHaveBeenCalledWith(1);
    });
  });

  describe('importServices', () => {
    it('should import services spreadsheet successfully', async () => {
      const mockResponse = {
        imported: 10,
        errors: [],
      };

      const mockFile = {
        originalname: 'servicos.xlsx',
        mimetype:
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        buffer: Buffer.from('file-content'),
        size: 1024,
      } as Express.Multer.File;

      mockImportServicesService.importFromSpreadsheet.mockResolvedValue(
        mockResponse,
      );

      const result = await controller.importServices(123, mockFile);

      expect(
        mockImportServicesService.importFromSpreadsheet,
      ).toHaveBeenCalledWith(123, mockFile);

      expect(
        mockImportServicesService.importFromSpreadsheet,
      ).toHaveBeenCalledTimes(1);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Planilha processada',
        data: mockResponse,
      });
    });
  });

  describe('cancelScheduleService', () => {
    it('should cancel schedule successfully', async () => {
      const mockId = 1;

      mockWorksServicesService.cancelServices.mockResolvedValue(undefined);

      const result = await controller.cancelScheduleService(mockId);

      expect(result).toEqual({
        statusCode: HttpStatus.OK,
        message: 'Programação dos serviços foi cancelada',
      });
      expect(service.cancelServices).toHaveBeenCalledWith(mockId);
      expect(service.cancelServices).toHaveBeenCalledTimes(1);
    });

    it('should handle cancellation for different ids', async () => {
      const mockId = 999;

      mockWorksServicesService.cancelServices.mockResolvedValue(undefined);

      const result = await controller.cancelScheduleService(mockId);

      expect(result.statusCode).toBe(HttpStatus.OK);
      expect(service.cancelServices).toHaveBeenCalledWith(mockId);
    });
  });

  describe('Error handling', () => {
    it('should propagate errors from service on scheduleServices', async () => {
      const mockScheduleData: ScheduleServicesDTO[] = [
        {
          id: 1,
          idTeam: 10,
          prog: 100,
          operation: 'instalação',
          point: 'p1',
          type: 'M',
        },
      ];
      const mockError = new Error('Schedule conflict');

      mockWorksServicesService.scheduleServices.mockRejectedValue(mockError);

      await expect(
        controller.scheduleServices(1, mockScheduleData),
      ).rejects.toThrow('Schedule conflict');
    });

    it('should propagate errors from service on cancel', async () => {
      const mockId = 1;
      const mockError = new Error('Schedule not found');

      mockWorksServicesService.cancelServices.mockRejectedValue(mockError);

      await expect(controller.cancelScheduleService(mockId)).rejects.toThrow(
        'Schedule not found',
      );
    });
  });
});
