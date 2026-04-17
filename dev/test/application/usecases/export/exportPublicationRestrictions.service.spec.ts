import * as ExcelJS from 'exceljs';
import { ExportPublicationRestrictionService } from 'src/application/usecases/export/exportPublicationRestriction.service';

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

describe('ExportPublicationRestrictionService', () => {
  let service: ExportPublicationRestrictionService;
  let mockResponse: any;

  beforeEach(() => {
    service = new ExportPublicationRestrictionService();

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
    const data = {
      works: [
        {
          ovnota: '1',
          ordemdiagrama: 'D1',
          criado_em: new Date('2026-04-17T09:45:00'),
          data_resolucao: new Date('2026-04-17T09:45:00'),
        },
        {
          ovnota: '2',
          ordemdiagrama: 'D2',
          criado_em: new Date('2026-04-17T00:00:00'),
          data_resolucao: new Date('2026-04-17T00:00:00'),
        },
      ],
    };
    await service.export(data, mockResponse);

    expect(ExcelJS.Workbook).toHaveBeenCalled();

    expect(addWorksheetMock).toHaveBeenCalledWith('Restrições Publicação');

    const worksheet = addWorksheetMock.mock.results[0].value;

    expect(worksheet.columns.length).toBeGreaterThan(0);

    expect(addRowsMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          ovnota: '1',
          ordemdiagrama: 'D1',
        }),
      ]),
    );

    expect(writeMock).toHaveBeenCalledWith(mockResponse);
  });

  // ============================================================
  // 🔥 BATCHING
  // ============================================================

  it('should split data into batches of 1000', async () => {
    const works = Array.from({ length: 2500 }, (_, i) => ({
      ovnota: String(i),
    }));

    await service.export({ works }, mockResponse);

    expect(addRowsMock).toHaveBeenCalledTimes(3);

    expect(addRowsMock.mock.calls[0][0].length).toBe(1000);
    expect(addRowsMock.mock.calls[1][0].length).toBe(1000);
    expect(addRowsMock.mock.calls[2][0].length).toBe(500);
  });

  // ============================================================
  // 📦 EDGE CASE
  // ============================================================

  it('should handle empty works array', async () => {
    await service.export({ works: [] }, mockResponse);

    expect(addRowsMock).not.toHaveBeenCalled();
    expect(writeMock).toHaveBeenCalledWith(mockResponse);
  });

  // ============================================================
  // ⚠️ ERRO
  // ============================================================

  it('should throw error if write fails', async () => {
    writeMock.mockRejectedValueOnce(new Error('write error'));

    await expect(
      service.export({ works: [{ ovnota: '1' }] }, mockResponse),
    ).rejects.toThrow('write error');
  });

  // ============================================================
  // 🧠 COLUNAS
  // ============================================================

  it('should define worksheet columns correctly', async () => {
    await service.export({ works: [] }, mockResponse);

    const worksheet = addWorksheetMock.mock.results[0].value;

    expect(worksheet.columns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ header: 'Ovnota', key: 'ovnota' }),
        expect.objectContaining({ header: 'Diagrama', key: 'ordemdiagrama' }),
        expect.objectContaining({ header: 'Municipio', key: 'mun' }),
      ]),
    );
  });
});
