import * as ExcelJS from 'exceljs';
import { promises as fs } from 'fs';
import { CapexProcessingService } from 'src/application/usecases/auxiliaryBase/capex/capexProcessing.service';

jest.mock('fs', () => ({
  promises: {
    unlink: jest.fn(),
  },
}));

jest.mock('exceljs', () => {
  return {
    stream: {
      xlsx: {
        WorkbookReader: jest.fn(),
      },
    },
  };
});

describe('CapexProcessingService', () => {
  let service: CapexProcessingService;

  const mockRepository = {
    truncateCN52N: jest.fn(),
    getObraIdsByDiagramas: jest.fn(),
    insertCapex: jest.fn(),
  };

  const mockLogger = {
    error: jest.fn(),
    warn: jest.fn(),
  };

  beforeEach(() => {
    jest.useFakeTimers();

    service = new CapexProcessingService(mockRepository as any);
    (service as any).logger = mockLogger;

    (fs.unlink as jest.Mock).mockResolvedValue(undefined);

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============================================================
  // 🧪 MOCK DO EXCEL STREAM
  // ============================================================

  const mockWorkbook = (rows: any[]) => {
    const worksheet = {
      async *[Symbol.asyncIterator]() {
        let index = 0;

        for (const row of rows) {
          index++;
          yield {
            number: index,
            values: row,
          };
        }
      },
    };

    return {
      async *[Symbol.asyncIterator]() {
        yield worksheet;
      },
    };
  };

  // ============================================================
  // 🚀 PROCESS - SUCESSO
  // ============================================================

  it('should process file successfully', async () => {
    const rows = [
      [], // header
      [],
      [
        null,
        null,
        'D1',
        'P1',
        'MAT1',
        '',
        '',
        '',
        'L',
        '',
        '',
        10,
        5,
        3,
        2,
        '',
        '',
        'X',
      ],
    ];

    jest
      .spyOn(ExcelJS.stream.xlsx, 'WorkbookReader')
      .mockImplementation(() => mockWorkbook(rows) as any);

    mockRepository.getObraIdsByDiagramas.mockResolvedValue(
      new Map([['D1', 1]]),
    );

    const progress = jest.fn();

    await service.process('file.xlsx', 'job-1', progress);

    expect(mockRepository.truncateCN52N).toHaveBeenCalled();
    expect(mockRepository.insertCapex).toHaveBeenCalled();

    expect(progress).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: 'completed',
      }),
    );

    expect(fs.unlink).toHaveBeenCalledWith('file.xlsx');
  });

  it('should process file successfully with missing.length === 0', async () => {
    const rows = [
      [], // header
      [],
      [
        null,
        null,
        'D1',
        'P1',
        'MAT1',
        '',
        '',
        '',
        'L',
        '',
        '',
        10,
        5,
        3,
        2,
        '',
        '',
        'X',
      ],
    ];

    jest
      .spyOn(ExcelJS.stream.xlsx, 'WorkbookReader')
      .mockImplementation(() => mockWorkbook(rows) as any);

    mockRepository.getObraIdsByDiagramas.mockResolvedValue(new Map([]));

    const progress = jest.fn();

    await service.process('file.xlsx', 'job-1', progress);

    expect(mockRepository.truncateCN52N).toHaveBeenCalled();
    expect(mockRepository.insertCapex).toHaveBeenCalled();

    expect(progress).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: 'completed',
      }),
    );

    expect(fs.unlink).toHaveBeenCalledWith('file.xlsx');
  });

  it('should evict oldest cache entry when MAX_CACHE is exceeded (FIFO)', async () => {
    // 🔥 reduz o cache pra forçar overflow rápido
    (service as any).MAX_CACHE = 2;

    const rows = [
      [],
      [],
      [null, null, 'D1'],
      [null, null, 'D2'],
      [null, null, 'D3'], // aqui estoura o cache
    ];

    jest
      .spyOn(ExcelJS.stream.xlsx, 'WorkbookReader')
      .mockImplementation(() => mockWorkbook(rows) as any);

    // cada chamada retorna um novo map com os diagramas
    mockRepository.getObraIdsByDiagramas.mockImplementation(
      async (diagramas: string[]) => {
        return new Map(diagramas.map((d, i) => [d, i + 1]));
      },
    );

    await service.process('file.xlsx', 'job-1');

    const cache = (service as any).obraCache;

    // 🔥 garante que o tamanho respeita o limite
    expect(cache.size).toBeLessThanOrEqual(2);

    // 🔥 D1 deve ter sido removido (FIFO)
    expect(cache.has('D1')).toBe(false);

    // 🔥 os mais recentes permanecem
    expect(cache.has('D2')).toBe(true);
    expect(cache.has('D3')).toBe(true);
  });

  // ============================================================
  // 🔥 BATCH PROCESSING
  // ============================================================

  it('should process multiple batches', async () => {
    const rows = Array.from({ length: 2005 }, (_, i) => [
      null,
      null,
      `D${i}`,
      'P',
      'MAT',
    ]);

    jest
      .spyOn(ExcelJS.stream.xlsx, 'WorkbookReader')
      .mockImplementation(() => mockWorkbook([[], [], ...rows]) as any);

    mockRepository.getObraIdsByDiagramas.mockResolvedValue(new Map());

    await service.process('file.xlsx', 'job-1');

    // Deve chamar insert mais de uma vez (batch > 1000)
    expect(mockRepository.insertCapex).toHaveBeenCalledTimes(3);
  });

  it('should not execute final batch block when batch is empty at the end', async () => {
    const BATCH_SIZE = (service as any).BATCH_SIZE;

    const rows = Array.from({ length: BATCH_SIZE }, (_, i) => [
      null,
      null,
      `D${i}`,
    ]);

    jest
      .spyOn(ExcelJS.stream.xlsx, 'WorkbookReader')
      .mockImplementation(() => mockWorkbook([[], [], ...rows]) as any);

    mockRepository.getObraIdsByDiagramas.mockResolvedValue(new Map());

    const processBatchSpy = jest.spyOn(service as any, 'processBatch');

    await service.process('file.xlsx', 'job-1');

    // 🔥 processBatch deve ser chamado exatamente 1 vez (no loop principal)
    expect(processBatchSpy).toHaveBeenCalledTimes(1);

    // 🔥 garante que NÃO houve chamada extra (do bloco final)
    expect(processBatchSpy).not.toHaveBeenCalledTimes(2);

    // 🔥 sanity check
    expect(mockRepository.insertCapex).toHaveBeenCalledTimes(1);
  });

  // ============================================================
  // 📡 PROGRESS (reading + processing)
  // ============================================================

  it('should emit reading progress', async () => {
    const rows = Array.from({ length: 1005 }, () => [null, null, 'D1']);

    jest
      .spyOn(ExcelJS.stream.xlsx, 'WorkbookReader')
      .mockImplementation(() => mockWorkbook([[], [], ...rows]) as any);

    mockRepository.getObraIdsByDiagramas.mockResolvedValue(new Map());

    const progress = jest.fn();

    await service.process('file.xlsx', 'job-1', progress);

    expect(progress).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: 'reading',
      }),
    );
  });

  it('should emit processing progress', async () => {
    const rows = Array.from({ length: 1001 }, () => [null, null, null]);

    jest
      .spyOn(ExcelJS.stream.xlsx, 'WorkbookReader')
      .mockImplementation(() => mockWorkbook([[], [], ...rows]) as any);

    mockRepository.getObraIdsByDiagramas.mockResolvedValue(new Map());

    const progress = jest.fn();

    await service.process('file.xlsx', 'job-1', progress);

    expect(progress).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: 'processing',
      }),
    );
  });

  // ============================================================
  // ⚠️ ERRO
  // ============================================================

  it('should emit error and rethrow', async () => {
    const error = new Error('fail');

    jest.spyOn(ExcelJS.stream.xlsx, 'WorkbookReader').mockImplementation(() => {
      throw error;
    });

    const progress = jest.fn();

    await expect(
      service.process('file.xlsx', 'job-1', progress),
    ).rejects.toThrow('fail');

    expect(progress).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: 'error',
      }),
    );

    expect(mockLogger.error).toHaveBeenCalled();
  });

  it('should emit error and rethrow with default message', async () => {
    const error = new Error();
    (error as any).message = undefined;

    jest.spyOn(ExcelJS.stream.xlsx, 'WorkbookReader').mockImplementation(() => {
      throw error;
    });

    const progress = jest.fn();

    await expect(
      service.process('file.xlsx', 'job-1', progress),
    ).rejects.toThrow();

    expect(progress).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: 'error',
        message: 'Erro durante a importação',
      }),
    );

    expect(mockLogger.error).toHaveBeenCalled();
  });

  // ============================================================
  // 🧹 CLEANUP (scheduleCleanup)
  // ============================================================

  it('should cleanup progressMap after ttl', async () => {
    const rows = [[], [], [null, null, 'D1']];

    jest
      .spyOn(ExcelJS.stream.xlsx, 'WorkbookReader')
      .mockImplementation(() => mockWorkbook(rows) as any);

    mockRepository.getObraIdsByDiagramas.mockResolvedValue(new Map());

    await service.process('file.xlsx', 'job-1');

    expect((service as any).progressMap.has('job-1')).toBe(true);

    jest.advanceTimersByTime(5 * 60 * 1000);

    expect((service as any).progressMap.has('job-1')).toBe(false);
  });

  // ============================================================
  // 🧠 HELPERS
  // ============================================================

  describe('helpers', () => {
    it('calcReadingPct should scale correctly', () => {
      const result = (service as any).calcReadingPct(50_000);

      expect(result).toBe(50);
    });

    it('calcProcessingPct should scale correctly', () => {
      const result = (service as any).calcProcessingPct(2000);

      expect(result).toBe(2);
    });

    it('initProgress should initialize correctly', () => {
      (service as any).initProgress('job-1');

      const state = (service as any).progressMap.get('job-1');

      expect(state).toMatchObject({
        phase: 'reading',
        percentage: 0,
      });
    });
  });

  // ============================================================
  // 🧾 FS ERROR
  // ============================================================

  it('should warn if unlink fails', async () => {
    (fs.unlink as jest.Mock).mockRejectedValue(new Error('fs error'));

    const rows = [[], [], [null, null, 'D1']];

    jest
      .spyOn(ExcelJS.stream.xlsx, 'WorkbookReader')
      .mockImplementation(() => mockWorkbook(rows) as any);

    mockRepository.getObraIdsByDiagramas.mockResolvedValue(new Map());

    await service.process('file.xlsx', 'job-1');

    expect(mockLogger.warn).toHaveBeenCalled();
  });
});
