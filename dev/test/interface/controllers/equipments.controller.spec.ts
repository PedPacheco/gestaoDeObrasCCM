import { Test, TestingModule } from '@nestjs/testing';
import { EquipmentService } from 'src/application/usecases/equipment.service';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import { EquipmentController } from 'src/interface/controllers/equipment.controller';
import { UsersService } from 'src/application/usecases/users.service';

describe('EquipmentController', () => {
  let controller: EquipmentController;
  let service: EquipmentService;

  const mockService = {
    getEquipment: jest.fn(),
    getWithoutLocation: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [EquipmentController],
      providers: [
        { provide: EquipmentService, useValue: mockService },
        { provide: UsersService, useValue: { findUser: jest.fn() } },
      ],
    }).compile();

    controller = module.get<EquipmentController>(EquipmentController);
    service = module.get<EquipmentService>(EquipmentService);

    jest.clearAllMocks();
  });

  describe('getEquipamentos', () => {
    it('should call equipmentService.getEquipment and return result', async () => {
      const query = { filter: 'test' };
      const expectedResult = [{ id: 1, name: 'Equipamento 1' }];
      mockService.getEquipment.mockResolvedValueOnce(expectedResult);

      const result = await controller.getEquipamentos(query);

      expect(service.getEquipment).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('exportWithoutLocation', () => {
    let mockRes: Partial<Response>;
    let mockWorkbookWrite: jest.SpyInstance;

    beforeEach(() => {
      mockRes = {
        setHeader: jest.fn(),
        end: jest.fn(),
      };
      // mock do ExcelJS.Workbook().xlsx.write()
      mockWorkbookWrite = jest
        .spyOn(ExcelJS.Workbook.prototype.xlsx, 'write')
        .mockImplementation(async () => Promise.resolve());
    });

    it('should generate excel and send response', async () => {
      const ovnotas = '12345,67890';
      const mockObras = [
        {
          ovnota: '12345',
          referencia: 'EQ-001',
          status: 'Pendente',
          conjunto: 'A',
          circuito: 'C1',
          empreiteira: 'Construtora X',
          tipo_obra: 'POSTE',
          executado: 0,
          empreendimento: 'Empreendimento Y',
        },
        {
          ovnota: '67890',
          referencia: 'EQ-002',
          status: 'Executado',
          conjunto: 'B',
          circuito: 'C2',
          empreiteira: 'Construtora Z',
          tipo_obra: 'TRANSFORMADOR',
          executado: 100,
          empreendimento: 'Empreendimento W',
        },
      ];

      mockService.getWithoutLocation.mockResolvedValueOnce(mockObras);

      await controller.exportWithoutLocation(ovnotas, mockRes as Response);

      expect(service.getWithoutLocation).toHaveBeenCalledWith(ovnotas);
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        'attachment; filename="obras-sem-localizacao.xlsx"',
      );
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      );
      expect(mockWorkbookWrite).toHaveBeenCalled();
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('should handle empty ovnotas and call service with empty string', async () => {
      mockService.getWithoutLocation.mockResolvedValueOnce([]);

      await controller.exportWithoutLocation(undefined, mockRes as Response);

      expect(service.getWithoutLocation).toHaveBeenCalledWith('');
      expect(mockWorkbookWrite).toHaveBeenCalled();
      expect(mockRes.end).toHaveBeenCalled();
    });

    it('should create sheet with correct headers', async () => {
      const mockSheet = {
        columns: [] as any[],
        getRow: jest.fn().mockReturnValue({ font: {} }),
        addRows: jest.fn(),
      };
      const addWorksheetSpy = jest
        .spyOn(ExcelJS.Workbook.prototype, 'addWorksheet')
        .mockReturnValue(mockSheet as any);

      mockService.getWithoutLocation.mockResolvedValueOnce([]);

      await controller.exportWithoutLocation('', mockRes as Response);

      expect(addWorksheetSpy).toHaveBeenCalledWith('Obras sem localização');

      // Aqui verificamos se as colunas foram definidas
      expect(mockSheet.columns).toEqual([
        { header: 'Nº da Nota', key: 'ovnota', width: 15 },
        { header: 'Equipamento Referência', key: 'referencia', width: 20 },
        { header: 'Status', key: 'status', width: 30 },
        { header: 'Conjunto', key: 'conjunto', width: 30 },
        { header: 'Circuito', key: 'circuito', width: 15 },
        { header: 'Empreiteira', key: 'empreiteira', width: 20 },
        { header: 'Tipo', key: 'tipo_obra', width: 35 },
        { header: 'Executado', key: 'executado', width: 12 },
        { header: 'Empreendimento', key: 'empreendimento', width: 25 },
      ]);
      expect(mockSheet.getRow).toHaveBeenCalledWith(1);
    });
  });
});
