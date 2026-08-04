// test/application/export/exportSuspensions.service.spec.ts
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import { ExportSuspensionsService } from 'src/application/usecases/export/exportSuspensions.service';
import { IExportRepository } from 'src/domain/contracts/IExportRepository';

jest.mock('exceljs', () => {
  const addRowsMock = jest.fn();
  const addWorksheetMock = jest.fn(() => ({
    columns: undefined,
    addRows: addRowsMock,
  }));
  const writeMock = jest.fn();
  const WorkbookMock = jest.fn(() => ({
    addWorksheet: addWorksheetMock,
    xlsx: { write: writeMock },
  }));

  return { Workbook: WorkbookMock };
});

describe('ExportSuspensionsService', () => {
  let service: ExportSuspensionsService;
  let mockRepository: jest.Mocked<IExportRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = {
      exportSuspensions: jest.fn(),
      exportSuspensionsRemoved: jest.fn(),
    } as unknown as jest.Mocked<IExportRepository>;

    service = new ExportSuspensionsService(mockRepository);
  });

  it('should export both suspended and removed suspensions to Excel', async () => {
    // Arrange
    const suspendedMock = [
      {
        obras: {
          ovnota: 'OV001',
          status: { status: 'Ativo' },
          tipos: { tipo_obra: 'Manutenção' },
          turmas: { turma: 'TURMA1' },
          municipios: { municipio: 'Mun1', regionais: { regional: 'REG1' } },
        },
        data: '2025-01-01',
        motivo: 'Motivo1',
      },
    ];

    const removedMock = [
      {
        obras: {
          ovnota: 'OV002',
          tipos: { tipo_obra: 'Instalação' },
          turmas: { turma: 'TURMA2' },
          municipios: { municipio: 'Mun2', regionais: { regional: 'REG2' } },
        },
        status: { status: 'Removido' },
        data_retirada: '2025-01-02',
      },
    ];

    mockRepository.exportSuspensions.mockResolvedValue(suspendedMock as any);
    mockRepository.exportSuspensionsRemoved.mockResolvedValue(
      removedMock as any,
    );

    const mockResponse = { setHeader: jest.fn() } as unknown as Response;

    // Act
    await service.export(mockResponse);

    // Assert repository calls
    expect(mockRepository.exportSuspensions).toHaveBeenCalledTimes(1);
    expect(mockRepository.exportSuspensionsRemoved).toHaveBeenCalledTimes(1);

    // Workbook assertions
    const WorkbookMock = (ExcelJS as any).Workbook as jest.Mock;
    expect(WorkbookMock).toHaveBeenCalledTimes(1);

    const workbookInstance = WorkbookMock.mock.results[0].value;

    // Check worksheet creation
    expect(workbookInstance.addWorksheet).toHaveBeenCalledWith('Suspensões');
    expect(workbookInstance.addWorksheet).toHaveBeenCalledWith(
      'Suspensões Retiradas',
    );

    const worksheet1 = workbookInstance.addWorksheet.mock.results[0].value;
    const worksheet2 = workbookInstance.addWorksheet.mock.results[1].value;

    // Columns set
    expect(worksheet1.columns?.length).toBe(8);
    expect(worksheet2.columns?.length).toBe(7);

    // addRows called with formatted data
    const rowsSuspended = worksheet1.addRows as jest.Mock;
    const rowsRemoved = worksheet2.addRows as jest.Mock;

    expect(rowsSuspended).toHaveBeenCalledTimes(2);
    expect(rowsRemoved).toHaveBeenCalledTimes(2);

    const suspendedFormatted = rowsSuspended.mock.calls[0][0][0];
    expect(suspendedFormatted.ovnota).toBe('OV001');
    expect(suspendedFormatted.motivo).toBe('Motivo1');
    expect(suspendedFormatted.status).toBe('Ativo');
    expect(suspendedFormatted.tipo_obra).toBe('Manutenção');
    expect(suspendedFormatted.parceira).toBe('TURMA1');
    expect(suspendedFormatted.municipio).toBe('Mun1');
    expect(suspendedFormatted.regional).toBe('REG1');
    expect(suspendedFormatted.data).toBe('2025-01-01');

    const removedFormatted = rowsRemoved.mock.calls[0][0][0];
    expect(removedFormatted.ovnota).toBe('OV001');

    // Check xlsx.write called
    expect(workbookInstance.xlsx.write).toHaveBeenCalledWith(mockResponse);
  });

  it('should handle batch processing when data exceeds batch size', async () => {
    // Arrange: create 1200 items to test batching
    const suspendedMock: any[] = [];
    const removedMock: any[] = [];

    for (let i = 0; i < 1200; i++) {
      suspendedMock.push({
        obras: {
          ovnota: `OV${i}`,
          status: { status: 'Ativo' },
          tipos: { tipo_obra: 'Tipo' },
          turmas: { turma: 'TURMA' },
          municipios: { municipio: 'Mun', regionais: { regional: 'REG' } },
        },
        data: '2025-01-01',
        motivo: 'Motivo',
      });
      removedMock.push({
        obras: {
          ovnota: `OVR${i}`,
          tipos: { tipo_obra: 'TipoR' },
          turmas: { turma: 'TURMAR' },
          municipios: { municipio: 'MunR', regionais: { regional: 'REGR' } },
        },
        status: { status: 'Removido' },
        data_retirada: '2025-01-02',
      });
    }

    mockRepository.exportSuspensions.mockResolvedValue(suspendedMock as any);
    mockRepository.exportSuspensionsRemoved.mockResolvedValue(
      removedMock as any,
    );

    const mockResponse = { setHeader: jest.fn() } as unknown as Response;

    // Act
    await service.export(mockResponse);

    const workbookInstance = (ExcelJS as any).Workbook.mock.results[0].value;
    const worksheet1 = workbookInstance.addWorksheet.mock.results[0].value;
    const worksheet2 = workbookInstance.addWorksheet.mock.results[1].value;
    const addRowsSuspended = worksheet1.addRows as jest.Mock;
    const addRowsRemoved = worksheet2.addRows as jest.Mock;

    // Suspended batch: 1200 -> 2 calls (1000 + 200)
    expect(addRowsSuspended).toHaveBeenCalledTimes(4);
    expect(addRowsSuspended.mock.calls[0][0].length).toBe(1000);
    expect(addRowsSuspended.mock.calls[1][0].length).toBe(200);

    // Removed batch: 1200 -> 2 calls
    expect(addRowsRemoved).toHaveBeenCalledTimes(4);
    expect(addRowsRemoved.mock.calls[0][0].length).toBe(1000);
    expect(addRowsRemoved.mock.calls[1][0].length).toBe(200);

    // xlsx.write called
    expect(workbookInstance.xlsx.write).toHaveBeenCalledWith(mockResponse);
  });
});
