import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import * as Exceljs from 'exceljs';
import { ExportCompletedWorksService } from 'src/modules/export/services/exportCompletedWorks.service';

jest.mock('exceljs');

describe('ExportCompletedWorks', () => {
  let service: ExportCompletedWorksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportCompletedWorksService],
    }).compile();

    service = module.get<ExportCompletedWorksService>(
      ExportCompletedWorksService,
    );
  });

  it('Should create an Excel file with the provided data', async () => {
    const mockWorksData = [
      {
        ovnota: '123456',
        ordemdiagrama: 'OD-001',
        ordem_dcd: 'DCD-01',
        ordem_dca: 'DCA-01',
        ordem_dcim: 'DCIM-01',
        status_ov_sap: 'Em Progresso',
        pep: 'PEP001',
        mun: 'São Paulo',
        abrev_regional: 'SP',
        conjunto: 'Conjunto 1',
        circuito: 'Circuito A',
        entrada: 'Entrada 1',
        prazo_fim: '2024-12-31',
        tipo_obra: 'Manutenção Geral',
        qtde_planejada: 10,
        qtde_pend: 2,
        mo_planejada: 5,
        status: 'Planejado',
        turma: 'Equipe Alpha',
        executado: 'Sim',
        first_data_prog: '2024-12-15',
        prog: '100%',
        exec: '80%',
        observ_programacao: 'Nenhuma observação adicional.',
        chi: 'CHI123',
        num_dp: 'DP-456',
        hora_ini: '08:00',
        hora_ter: '17:00',
        equipe_linha_morta: 'Equipe LM-1',
        equipe_linha_viva: 'Equipe LV-1',
        equipe_regularizacao: 'Equipe Reg-1',
        data_empreitamento: '2024-11-20',
        empreendimento: 'Empreendimento X',
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

    const workbookMock = {
      addWorksheet: addWorksheetMock,
      xlsx: { write: writeMock },
    };

    (Exceljs.Workbook as jest.Mock).mockImplementation(() => workbookMock);

    await service.export(mockWorksData, mockResponse);

    expect(Exceljs.Workbook).toHaveBeenCalledTimes(1);
    expect(workbookMock.addWorksheet).toHaveBeenCalledWith('Obras executadas');
    expect(workSheetMock.addRows).toHaveBeenCalledWith(mockWorksData);
    expect(workbookMock.xlsx.write).toHaveBeenCalledWith(mockResponse);
  });
});
