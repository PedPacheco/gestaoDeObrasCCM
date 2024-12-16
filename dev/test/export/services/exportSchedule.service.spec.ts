import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { ExportScheduleService } from 'src/modules/export/services/exportSchedule.service';

import { Test, TestingModule } from '@nestjs/testing';

jest.mock('exceljs');

describe('ExportScheduleService', () => {
  let service: ExportScheduleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportScheduleService],
    }).compile();

    service = module.get<ExportScheduleService>(ExportScheduleService);
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

    await service.export(MockScheduleData, mockResponse);

    expect(ExcelJS.Workbook).toHaveBeenCalledTimes(1);
    expect(workBookMock.addWorksheet).toHaveBeenCalledWith('Programação');
    expect(addRowsMock).toHaveBeenCalledWith(MockScheduleData);
    expect(workBookMock.xlsx.write).toHaveBeenCalledWith(mockResponse);
  });
});
