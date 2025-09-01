import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';
import * as Exceljs from 'exceljs';
import { ExportCompletedWorksService } from 'src/application/export/exportCompletedWorks.service';
import { worksInPortfolioResponseService } from 'src/interface/types/works/getWorksInPortfolioInterface';

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
    const mockWorksData: any[] = [
      {
        ovnota: '123456',
        ordemdiagrama: 'OD-001',
        ordem_dcd: 'DCD-01',
        ordem_dca: 'DCA-01',
        ordem_dcim: 'DCIM-01',
        status_ov_sap: 50,
        pep: 'PEP001',
        mun: 'São Paulo',
        abrev_regional: 'SP',
        conjunto: 'Conjunto 1',
        circuito: 'Circuito A',
        entrada: new Date('2024-01-15T00:00:00.000Z'),
        prazo_fim: 90,
        tipo_obra: 'Manutenção Geral',
        qtde_planejada: 10,
        qtde_pend: 2,
        mo_planejada: 5,
        status: 'Planejado',
        turma: 'Equipe Alpha',
        executado: 50,
        data_empreitamento: new Date('2024-02-20T00:00:00.000Z'),
        empreendimento: 'Empreendimento X',
        id: 0,
        prazo: 0,
        contagem_ocorrencias: 0,
        id_status: 0,
      },
    ];

    const mockTotals = {
      total_obras: 1,
      total_mo_planejada: 5,
      total_mo_exec: 2.5,
      total_mo_suspensa: 0,
      total_qtde_planejada: 10,
      total_qtde_pend: 2,
    };

    const mockWorksRsponse: worksInPortfolioResponseService = {
      works: mockWorksData,
      totals: mockTotals,
    };

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

    await service.export(mockWorksRsponse, mockResponse);

    expect(Exceljs.Workbook).toHaveBeenCalledTimes(1);
    expect(workbookMock.addWorksheet).toHaveBeenCalledWith('Obras executadas');
    expect(workSheetMock.addRows).toHaveBeenCalledWith(mockWorksData);
    expect(workbookMock.xlsx.write).toHaveBeenCalledWith(mockResponse);
  });
});
