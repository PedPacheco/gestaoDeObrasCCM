import { Test, TestingModule } from '@nestjs/testing';
import * as Exceljs from 'exceljs';
import { Response } from 'express';
import { ExportWorksInPortfolioService } from 'src/modules/export/services/exportWorksInPortfolio.service';

jest.mock('exceljs');

describe('ExportWorksInPortfolio', () => {
  let service: ExportWorksInPortfolioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExportWorksInPortfolioService],
    }).compile();

    service = module.get<ExportWorksInPortfolioService>(
      ExportWorksInPortfolioService,
    );
  });

  it('Should create an Excel File with the provided data', async () => {
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

    const writeMock = jest.fn();
    const addRowsMock = jest.fn();

    const worksheetMock = {
      addRows: addRowsMock,
    };

    const addWorksheetMock = jest.fn().mockReturnValue(worksheetMock);

    const workBookMock = {
      addWorksheet: addWorksheetMock,
      xlsx: { write: writeMock },
    };

    (Exceljs.Workbook as jest.Mock).mockImplementation(() => workBookMock);

    await service.export(mockWorksData, mockResponse);

    expect(Exceljs.Workbook).toHaveBeenCalledTimes(1);
    expect(workBookMock.addWorksheet).toHaveBeenCalledWith('Obras em carteira');
    expect(worksheetMock.addRows).toHaveBeenCalledWith(mockWorksData);
    expect(workBookMock.xlsx.write).toHaveBeenCalledWith(mockResponse);
  });
});
