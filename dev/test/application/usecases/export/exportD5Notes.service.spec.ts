import * as ExcelJS from 'exceljs';
import { ExportD5NotesService } from 'src/application/usecases/export/exportD5Notes.service';

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

const makeNote = (overrides: Record<string, any> = {}) => ({
  nota_d5: 'D5-001',
  obra: 'OV-123',
  ordemDiagrama: 'DIAG-1',
  tipoObra: 'Ampliação',
  local_instalacao: 'LI-9',
  municipio: 'Cascais',
  regional: 'Sul',
  parceira: 'Parceira A',
  status: 'Em curso',
  status_sap: 'REL',
  validacao_anual: 'Sim',
  moRetida: 150.3,
  criado_em: new Date('2026-01-01T00:00:00.000Z'),
  conclusao_nota: null,
  usuarioModificador: 'Ana Silva',
  ...overrides,
});

describe('ExportD5NotesService', () => {
  let service: ExportD5NotesService;
  let mockResponse: any;

  beforeEach(() => {
    service = new ExportD5NotesService();
    mockResponse = {};

    addRowsMock.mockReset();
    writeMock.mockReset();
    addWorksheetMock.mockReset();

    addWorksheetMock.mockReturnValue({
      columns: [],
      addRows: addRowsMock,
    });
    writeMock.mockResolvedValue(undefined);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('export', () => {
    // ============================================================
    // 🚀 SUCESSO
    // ============================================================
    it('should create workbook, add worksheet, set columns and write response', async () => {
      const data = {
        d5Notes: [
          makeNote({ nota_d5: 'D5-001' }),
          makeNote({ nota_d5: 'D5-002' }),
        ],
      };

      await service.export(data, mockResponse);

      expect(ExcelJS.Workbook).toHaveBeenCalled();
      expect(addWorksheetMock).toHaveBeenCalledWith('Notas D5');

      const worksheet = addWorksheetMock.mock.results[0].value;
      expect(worksheet.columns.length).toBeGreaterThan(0);

      expect(addRowsMock).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            nota_d5: 'D5-001',
            municipio: 'Cascais',
          }),
        ]),
      );

      expect(writeMock).toHaveBeenCalledWith(mockResponse);
    });

    // ============================================================
    // 🔥 BATCHING
    // ============================================================
    it('should split data into batches of 1000', async () => {
      const data = {
        d5Notes: Array.from({ length: 2500 }, (_, i) =>
          makeNote({ nota_d5: `D5-${i}` }),
        ),
      };

      await service.export(data, mockResponse);

      expect(addRowsMock).toHaveBeenCalledTimes(3);
      expect(addRowsMock.mock.calls[0][0].length).toBe(1000);
      expect(addRowsMock.mock.calls[1][0].length).toBe(1000);
      expect(addRowsMock.mock.calls[2][0].length).toBe(500);
    });

    it('should preserve the order of rows across batches', async () => {
      const data = {
        d5Notes: Array.from({ length: 1500 }, (_, i) =>
          makeNote({ nota_d5: `D5-${i}` }),
        ),
      };

      await service.export(data, mockResponse);

      expect(addRowsMock.mock.calls[0][0][0].nota_d5).toBe('D5-0');
      expect(addRowsMock.mock.calls[0][0][999].nota_d5).toBe('D5-999');
      expect(addRowsMock.mock.calls[1][0][0].nota_d5).toBe('D5-1000');
      expect(addRowsMock.mock.calls[1][0][499].nota_d5).toBe('D5-1499');
    });

    it('should add a single batch when data fits in one chunk', async () => {
      const data = {
        d5Notes: Array.from({ length: 1000 }, (_, i) =>
          makeNote({ nota_d5: `D5-${i}` }),
        ),
      };

      await service.export(data, mockResponse);

      expect(addRowsMock).toHaveBeenCalledTimes(1);
      expect(addRowsMock.mock.calls[0][0].length).toBe(1000);
    });

    // ============================================================
    // 📦 EDGE CASE
    // ============================================================
    it('should handle empty d5Notes array', async () => {
      await service.export({ d5Notes: [] }, mockResponse);

      expect(addRowsMock).not.toHaveBeenCalled();
      expect(writeMock).toHaveBeenCalledWith(mockResponse);
    });

    // ============================================================
    // ⚠️ ERRO
    // ============================================================
    it('should throw error if write fails', async () => {
      writeMock.mockRejectedValueOnce(new Error('write error'));

      await expect(
        service.export({ d5Notes: [makeNote()] }, mockResponse),
      ).rejects.toThrow('write error');
    });

    it('should throw if d5Notes is missing', async () => {
      await expect(service.export({} as any, mockResponse)).rejects.toThrow();
    });

    // ============================================================
    // 🧠 COLUNAS
    // ============================================================
    it('should define worksheet columns correctly', async () => {
      await service.export({ d5Notes: [] }, mockResponse);

      const worksheet = addWorksheetMock.mock.results[0].value;

      expect(worksheet.columns).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ header: 'Nota D5', key: 'nota_d5' }),
          expect.objectContaining({ header: 'Obra vinculada', key: 'obra' }),
          expect.objectContaining({
            header: 'Ordem/Diagrama',
            key: 'ordemDiagrama',
          }),
          expect.objectContaining({ header: 'MO Retida', key: 'moRetida' }),
          expect.objectContaining({
            header: 'Usuário modificador',
            key: 'usuarioModificador',
          }),
        ]),
      );
    });

    it('should define all 15 columns in the expected order', async () => {
      await service.export({ d5Notes: [] }, mockResponse);

      const worksheet = addWorksheetMock.mock.results[0].value;

      expect(worksheet.columns.map((c: any) => c.key)).toEqual([
        'nota_d5',
        'obra',
        'ordemDiagrama',
        'tipoObra',
        'local_instalacao',
        'municipio',
        'regional',
        'parceira',
        'status',
        'status_sap',
        'validacao_anual',
        'moRetida',
        'criado_em',
        'conclusao_nota',
        'usuarioModificador',
      ]);
    });

    it('should set a width for every column', async () => {
      await service.export({ d5Notes: [] }, mockResponse);

      const worksheet = addWorksheetMock.mock.results[0].value;

      worksheet.columns.forEach((column: any) => {
        expect(column.width).toBeGreaterThan(0);
      });
    });

    // ============================================================
    // 🔄 ORDEM DAS OPERAÇÕES
    // ============================================================
    it('should write to the response only after adding the rows', async () => {
      await service.export({ d5Notes: [makeNote()] }, mockResponse);

      expect(addRowsMock.mock.invocationCallOrder[0]).toBeLessThan(
        writeMock.mock.invocationCallOrder[0],
      );
    });
  });
});
