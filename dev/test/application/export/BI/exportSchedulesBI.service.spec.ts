import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { ExportSchedulesBIService } from 'src/application/services/export/BI/exportSchedulesBI.service';
import { EXPORT_REPOSITORY } from 'src/domain/repositories/IExportRepository';

import { Test, TestingModule } from '@nestjs/testing';

jest.mock('exceljs');

describe('ExportSchedulesBIService', () => {
  let service: ExportSchedulesBIService;

  const mockRepository = {
    exportSchedules: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportSchedulesBIService,
        { provide: EXPORT_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ExportSchedulesBIService>(ExportSchedulesBIService);
  });

  it('Should create an Excel File with the provided data', async () => {
    const MockScheduleData = [
      {
        ovnota: '12345',
        ordemdiagrama: 'Ordem1',
        mun: 'Cidade1',
        conjunto: 'Conjunto1',
        circuito: 'Circuito1',
        entrada: 'Entrada1',
        prazo_fim: '2024-12-31',
        tipo_obra: 'Obra1',
        qtde_planejada: 10,
        mo_planejada: 5,
        turma: 'Equipe1',
        executado: 'Sim',
        data_prog: '2024-12-01',
        prog: 'Programado',
        exec: 'Executado',
        observ_programacao: 'Observação 1',
        num_dp: '123',
        hora_ini: '08:00',
        hora_ter: '16:00',
        equipe_linha_morta: 'EquipeLM',
        equipe_linha_viva: 'EquipeLV',
        equipe_regularizacao: 'EquipeReg',
      },
    ];

    mockRepository.exportSchedules.mockResolvedValue(MockScheduleData);

    const mockResponse = {
      setHeader: jest.fn(),
    } as unknown as Response;

    const addRowsMock = jest.fn();
    const writeMock = jest.fn();

    const workSheetMock = {
      addRows: addRowsMock,
    };

    const addWorksheetMock = jest.fn().mockReturnValue(workSheetMock);

    const workBookMock = {
      addWorksheet: addWorksheetMock,
      xlsx: { write: writeMock },
    };

    (ExcelJS.Workbook as jest.Mock).mockImplementation(() => workBookMock);

    await service.export(mockResponse);

    expect(ExcelJS.Workbook).toHaveBeenCalledTimes(1);
    expect(workBookMock.addWorksheet).toHaveBeenCalledWith('Programação');
    expect(addRowsMock).toHaveBeenCalledWith(MockScheduleData);
    expect(workBookMock.xlsx.write).toHaveBeenCalledWith(mockResponse);
  });
});
