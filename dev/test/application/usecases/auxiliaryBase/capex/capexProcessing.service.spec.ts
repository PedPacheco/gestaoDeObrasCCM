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

  it('should ignore records when id_obra is not found', async () => {
    const rows = [[], [], [null, null, null, 'P1', 'MAT1']];

    jest
      .spyOn(ExcelJS.stream.xlsx, 'WorkbookReader')
      .mockImplementation(() => mockWorkbook(rows) as any);

    // 🔥 nenhum id_obra encontrado
    mockRepository.getObraIdsByDiagramas.mockResolvedValue(new Map());

    await service.process('file.xlsx', 'job-1');

    // ✅ não deve inserir
    expect(mockRepository.insertCapex).not.toHaveBeenCalled();

    // ✅ deve armazenar ignorados
    const ignored = service.getIgnored('job-1');

    expect(ignored).toHaveLength(1);

    expect(ignored[0]).toMatchObject({
      diagrama_rede: null,
      material: 'MAT1',
    });
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

    mockRepository.getObraIdsByDiagramas.mockImplementation(
      async (diagramas: string[]) => {
        return new Map(diagramas.map((d, i) => [d, i + 1]));
      },
    );

    await service.process('file.xlsx', 'job-1');

    expect(mockRepository.insertCapex).toHaveBeenCalledTimes(3);
  });

  it('should not execute final batch block when batch is empty at the end', async () => {
    const BATCH_SIZE = (service as any).BATCH_SIZE;

    const rows = Array.from({ length: BATCH_SIZE }, (_, i) => [
      null,
      null,
      `D${i}`,
    ]);

    rows.push([null, null, null]);

    jest
      .spyOn(ExcelJS.stream.xlsx, 'WorkbookReader')
      .mockImplementation(() => mockWorkbook([[], [], ...rows]) as any);

    mockRepository.getObraIdsByDiagramas.mockResolvedValue(new Map());

    const processBatchSpy = jest.spyOn(service as any, 'processBatch');

    await service.process('file.xlsx', 'job-1');

    // 🔥 processBatch deve ser chamado exatamente 1 vez (no loop principal)
    expect(processBatchSpy).toHaveBeenCalledTimes(2);

    // 🔥 garante que NÃO houve chamada extra (do bloco final)
    expect(processBatchSpy).not.toHaveBeenCalledTimes(3);

    // 🔥 sanity check
    expect(mockRepository.insertCapex).toHaveBeenCalledTimes(0);
  });

  it('should add ignored items only until remaining space limit', async () => {
    (service as any).MAX_IGNORED = 3;

    // 🔥 já existe 1
    (service as any).ignoredMap.set('job-1', [{ diagrama_rede: 'A' }]);

    const rows = [
      [],
      [],
      [null, null, 'D2'],
      [null, null, 'D3'],
      [null, null, 'D4'],
    ];

    jest
      .spyOn(ExcelJS.stream.xlsx, 'WorkbookReader')
      .mockImplementation(() => mockWorkbook(rows) as any);

    mockRepository.getObraIdsByDiagramas.mockResolvedValue(new Map());

    await service.process('file.xlsx', 'job-1');

    const ignored = service.getIgnored('job-1');

    // 🔥 só pode completar até 3
    expect(ignored).toHaveLength(3);
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
    const rows = Array.from({ length: 1001 }, (_, i) => [null, null, `D${i}`]);

    jest
      .spyOn(ExcelJS.stream.xlsx, 'WorkbookReader')
      .mockImplementation(() => mockWorkbook([[], [], ...rows]) as any);

    mockRepository.getObraIdsByDiagramas.mockImplementation(
      async (diagramas: string[]) => {
        return new Map(diagramas.map((d, i) => [d, i + 1]));
      },
    );

    const progress = jest.fn();

    await service.process('file.xlsx', 'job-1', progress);

    expect(progress).toHaveBeenCalledWith(
      expect.objectContaining({
        phase: 'processing',
      }),
    );
  });

  it('should respect MAX_IGNORED limit', async () => {
    (service as any).MAX_IGNORED = 2;

    const rows = [
      [],
      [],
      [null, null, 'D1'],
      [null, null, 'D2'],
      [null, null, 'D3'],
    ];

    jest
      .spyOn(ExcelJS.stream.xlsx, 'WorkbookReader')
      .mockImplementation(() => mockWorkbook(rows) as any);

    mockRepository.getObraIdsByDiagramas.mockResolvedValue(new Map());

    await service.process('file.xlsx', 'job-1');

    const ignored = service.getIgnored('job-1');

    expect(ignored).toHaveLength(2);
  });

  it('should initialize ignored array when jobId does not exist in ignoredMap', async () => {
    const batch = [{ diagrama_rede: 'INVALID-1' }];

    // 🔥 nenhum id_obra encontrado
    mockRepository.getObraIdsByDiagramas.mockResolvedValue(new Map());

    // 🔥 sanity check
    expect((service as any).ignoredMap.has('job-1')).toBe(false);

    await (service as any).processBatch(batch, 'job-1');

    const ignored = service.getIgnored('job-1');

    expect(ignored).toHaveLength(1);

    expect(ignored[0]).toMatchObject({
      diagrama_rede: 'INVALID-1',
    });
  });

  it('should not add ignored items when MAX_IGNORED is already reached', async () => {
    (service as any).MAX_IGNORED = 2;

    // 🔥 mapa já cheio
    (service as any).ignoredMap.set('job-1', [
      { diagrama_rede: 'A' },
      { diagrama_rede: 'B' },
    ]);

    const batch = [{ diagrama_rede: 'D3' }, { diagrama_rede: 'D4' }];

    mockRepository.getObraIdsByDiagramas.mockResolvedValue(new Map());

    await (service as any).processBatch(batch, 'job-1');

    const ignored = service.getIgnored('job-1');

    // 🔥 continua exatamente igual
    expect(ignored).toEqual([{ diagrama_rede: 'A' }, { diagrama_rede: 'B' }]);

    expect(ignored).toHaveLength(2);
  });

  it('should build progress message with ignored count', () => {
    (service as any).ignoredMap.set('job-1', [{}, {}]);

    const result = (service as any).buildProgressMessage('job-1', 100);

    expect(result).toBe('100 registros processados (2 ignorados)');
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

  it('should cleanup ignoredMap after ttl', async () => {
    const rows = [[], [], [null, null, 'D1']];

    jest
      .spyOn(ExcelJS.stream.xlsx, 'WorkbookReader')
      .mockImplementation(() => mockWorkbook(rows) as any);

    mockRepository.getObraIdsByDiagramas.mockResolvedValue(new Map());

    await service.process('file.xlsx', 'job-1');

    expect((service as any).ignoredMap.has('job-1')).toBe(true);

    jest.advanceTimersByTime(5 * 60 * 1000);

    expect((service as any).ignoredMap.has('job-1')).toBe(false);
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

    it('buildProgressMessage should return zero ignored when job does not exist', () => {
      const result = (service as any).buildProgressMessage('unknown-job', 10);

      expect(result).toBe('10 registros processados (0 ignorados)');
    });

    it('buildProgressMessage should return completed message', () => {
      (service as any).ignoredMap.set('job-1', [{}, {}]);

      const result = (service as any).buildProgressMessage('job-1', 100, true);

      expect(result).toBe('Importação concluída: 100 registros (2 ignorados)');
    });

    it('getIgnored should return empty array when job does not exist', () => {
      expect(service.getIgnored('unknown-job')).toEqual([]);
    });
  });

  // ============================================================
  // 🧠 DRAIN EVERY
  // ============================================================

  it('should drain task pool periodically (DRAIN_EVERY)', async () => {
    // 🔥 força cenário controlado
    (service as any).BATCH_SIZE = 2;
    (service as any).DRAIN_EVERY = 2;
    (service as any).CONCURRENCY = 1;

    const rows = [
      [],
      [],
      [null, null, 'D1'],
      [null, null, 'D2'], // batch 1
      [null, null, 'D3'],
      [null, null, 'D4'], // batch 2 -> DRAIN aqui
      [null, null, 'D5'],
      [null, null, 'D6'], // batch 3
    ];

    jest
      .spyOn(ExcelJS.stream.xlsx, 'WorkbookReader')
      .mockImplementation(() => mockWorkbook(rows) as any);

    mockRepository.getObraIdsByDiagramas.mockResolvedValue(new Map());

    // 🔥 controle de execução
    let runningTasks = 0;
    let maxParallel = 0;

    jest.spyOn(service as any, 'processBatch').mockImplementation(async () => {
      runningTasks++;
      maxParallel = Math.max(maxParallel, runningTasks);

      // simula async real
      await Promise.resolve();

      runningTasks--;
    });

    await service.process('file.xlsx', 'job-1');

    // 🔥 garante que não acumulou tasks descontroladamente
    expect(maxParallel).toBeLessThanOrEqual(1);

    // 🔥 sanity check: processBatch foi chamado
    expect((service as any).processBatch).toHaveBeenCalled();
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
