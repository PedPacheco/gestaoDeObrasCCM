import * as Exceljs from 'exceljs';
import { Response } from 'express';
import { ExportCompletedWorksBIService } from 'src/application/usecases/export/BI/exportCompletedWorksBI.service';
import type { Mock } from 'vitest';

import { Test, TestingModule } from '@nestjs/testing';
import { EXPORT_REPOSITORY } from 'src/domain/repositories/IExportRepository';

vi.mock('exceljs');

const { WorkbookMock } = vi.hoisted(() => ({
  WorkbookMock: vi.fn(),
}));

// Expose Workbook both as named and default export (CJS interop)
vi.mock('exceljs', () => ({
  Workbook: WorkbookMock,
  default: { Workbook: WorkbookMock },
}));

describe('ExportCompletedWorksBIService', () => {
  let service: ExportCompletedWorksBIService;

  const mockRepository = {
    exportCompletedWorks: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExportCompletedWorksBIService,
        { provide: EXPORT_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<ExportCompletedWorksBIService>(
      ExportCompletedWorksBIService,
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

    mockRepository.exportCompletedWorks.mockResolvedValue(mockWorksData);

    const mockResponse = {
      setHeader: vi.fn(),
    } as unknown as Response;

    const addRowsMock = vi.fn();
    const writeMock = vi.fn();

    const workSheetMock = {
      addRows: addRowsMock,
    };

    const addWorksheetMock = vi.fn().mockReturnValue(workSheetMock);

    const workbookMock = {
      addWorksheet: addWorksheetMock,
      xlsx: { write: writeMock },
    };

    (Exceljs.Workbook as Mock).mockImplementation(function () {
      return workbookMock;
    });

    await service.export(mockResponse);

    expect(Exceljs.Workbook).toHaveBeenCalledTimes(1);
    expect(workbookMock.addWorksheet).toHaveBeenCalledWith(
      'EXPORTACAO DADOS OBRAS',
    );
    expect(workSheetMock.addRows).toHaveBeenCalledWith(mockWorksData);
    expect(workbookMock.xlsx.write).toHaveBeenCalledWith(mockResponse);
  });
});
