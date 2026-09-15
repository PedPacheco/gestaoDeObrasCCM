import * as ExcelJS from 'exceljs';
import { ExportFeasibilityService } from 'src/application/usecases/export/exportFeasibility.service';

// mocks compartilhados (fora do jest.mock)
const addRowsMock = jest.fn();
const addWorksheetMock = jest.fn();
const writeMock = jest.fn();

jest.mock('exceljs', () => {
  return {
    Workbook: jest.fn().mockImplementation(() => ({
      addWorksheet: addWorksheetMock,
      xlsx: {
        write: writeMock,
      },
    })),
  };
});

describe('ExportFeasibilityService', () => {
  let service: ExportFeasibilityService;
  let mockResponse: any;

  beforeEach(() => {
    service = new ExportFeasibilityService();

    mockResponse = {};

    addRowsMock.mockReset();
    writeMock.mockReset();

    addWorksheetMock.mockReturnValue({
      columns: [],
      addRows: addRowsMock,
    });

    writeMock.mockResolvedValue(undefined);
  });

  // ============================================================
  // 🚀 SUCESSO
  // ============================================================

  it('should create workbook, add worksheet, set columns and write response', async () => {
    const data = [
      {
        ovnota: '1',
        ordemDiagrama: 'D1',
      },
      {
        ovnota: '2',
        ordemDiagrama: 'D2',
      },
    ];

    await service.export(data, mockResponse);

    expect(ExcelJS.Workbook).toHaveBeenCalled();

    expect(addWorksheetMock).toHaveBeenCalledWith('Viabilidade');

    const worksheet = addWorksheetMock.mock.results[0].value;

    expect(worksheet.columns.length).toBeGreaterThan(0);

    expect(addRowsMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          ovnota: '1',
          ordemDiagrama: 'D1',
        }),
      ]),
    );

    expect(writeMock).toHaveBeenCalledWith(mockResponse);
  });

  // ============================================================
  // 🔥 BATCHING
  // ============================================================

  it('should split data into batches of 1000', async () => {
    const data = Array.from({ length: 2500 }, (_, i) => ({
      ovnota: String(i),
    }));

    await service.export(data, mockResponse);

    expect(addRowsMock).toHaveBeenCalledTimes(3);

    expect(addRowsMock.mock.calls[0][0].length).toBe(1000);
    expect(addRowsMock.mock.calls[1][0].length).toBe(1000);
    expect(addRowsMock.mock.calls[2][0].length).toBe(500);
  });

  // ============================================================
  // 📦 EDGE CASE
  // ============================================================

  it('should handle empty works array', async () => {
    await service.export([], mockResponse);

    expect(addRowsMock).not.toHaveBeenCalled();
    expect(writeMock).toHaveBeenCalledWith(mockResponse);
  });

  // ============================================================
  // ⚠️ ERRO
  // ============================================================

  it('should throw error if write fails', async () => {
    writeMock.mockRejectedValueOnce(new Error('write error'));

    await expect(
      service.export([{ ovnota: '1' }], mockResponse),
    ).rejects.toThrow('write error');
  });

  // ============================================================
  // 🧠 COLUNAS
  // ============================================================

  it('should define worksheet columns correctly', async () => {
    await service.export([], mockResponse);

    const worksheet = addWorksheetMock.mock.results[0].value;

    expect(worksheet.columns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ header: 'OV/Nota', key: 'ovnota' }),
        expect.objectContaining({
          header: 'Ordem Diagrama',
          key: 'ordemDiagrama',
        }),
        expect.objectContaining({ header: 'Data Envio', key: 'data_envio' }),
      ]),
    );
  });
});
