import { Test, TestingModule } from '@nestjs/testing';
import * as Exceljs from 'exceljs';
import { Response } from 'express';
import { ExportWorksInPortfolioBI } from 'src/application/usecases/export/BI/exportWorkInPortfolioBI.service';
import { EXPORT_REPOSITORY } from 'src/domain/repositories/IExportRepository';

jest.mock('exceljs');

describe('ExportWorksInPortfolio', () => {
  let service: ExportWorksInPortfolioBI;

  const mockRepository = {
    exportWorksInPortfolio: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportWorksInPortfolioBI,
        { provide: EXPORT_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ExportWorksInPortfolioBI>(ExportWorksInPortfolioBI);
  });

  it('Should create an Excel File with the provided data', async () => {
    const mockWorksData = [
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
        ano_plan: 2025,
        executado: 50,
        data_empreitamento: new Date('2024-02-20T00:00:00.000Z'),
        empreendimento: 'Empreendimento X',
        id: 0,
        prazo: 0,
        contagem_de_ocorrencias: 0,
        id_status: 0,
        total_equipe_lm: 1,
        total_equipe_lv: 0,
        total_equipe_reg: 0,
        total_exec: 80,
        total_pend: 20,
        total_prog: 0,
      },
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
        ano_plan: 2025,
        executado: 50,
        data_empreitamento: new Date('2024-02-20T00:00:00.000Z'),
        empreendimento: 'Empreendimento X',
        id: 0,
        prazo: 0,
        contagem_de_ocorrencias: 10n,
        id_status: 0,
        total_equipe_lm: 1,
        total_equipe_lv: 0,
        total_equipe_reg: 0,
        total_exec: 80,
        total_pend: 20,
        total_prog: 0,
      },
    ];

    mockRepository.exportWorksInPortfolio.mockResolvedValue(mockWorksData);

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

    await service.export(mockResponse);

    const mockFormatted = [
      { ...mockWorksData[0] },
      { ...mockWorksData[1], contagem_de_ocorrencias: 10 },
    ];

    expect(Exceljs.Workbook).toHaveBeenCalledTimes(1);
    expect(workBookMock.addWorksheet).toHaveBeenCalledWith(
      'EXPORTACAO DADOS OBRAS',
    );
    expect(worksheetMock.addRows).toHaveBeenCalledWith(mockFormatted);
    expect(workBookMock.xlsx.write).toHaveBeenCalledWith(mockResponse);

    const rowsPassed = addRowsMock.mock.calls[0][0];
    expect(rowsPassed[1].contagem_de_ocorrencias).toBe(10);
  });
});
