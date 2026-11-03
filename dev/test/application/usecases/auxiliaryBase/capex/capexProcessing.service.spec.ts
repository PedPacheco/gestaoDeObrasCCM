import { BadRequestException } from '@nestjs/common';
import { existsSync } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { CapexProcessingService } from 'src/application/usecases/auxiliaryBase/capex/capexProcessing.service';

// ─── Helpers ──────────────────────────────────────────────────────────

type Row = Record<string, unknown> & { diagrama_rede: string | null };

const makeRow = (diagrama: string | null, material = '71000460'): Row => ({
  diagrama_rede: diagrama,
  def_proj: 'B/000215',
  material,
  texto_breve: 'SRV CCM',
  centro: 'C001',
  dep: null,
  cti: 'N',
  elemento_pep: null,
  und: 'M',
  preco: 3.2,
  qtd_necessaria: 510.9,
  qtd_retirada: 0,
  qtd_recebida: 0,
  qtd_falta: 510.9,
  reserva: null,
});

const makeRows = (length: number, diagrama = 'D1'): Row[] =>
  Array.from({ length }, () => makeRow(diagrama));

/** Obras por diagrama usadas pelo mock de getObraIdsByDiagramas. */
const OBRAS = new Map<string, number[]>([
  ['D1', [10]],
  ['D2', [20]],
  ['AMB', [30, 31]], // diagrama presente em duas obras → ambíguo
]);

describe('CapexProcessingService', () => {
  let service: CapexProcessingService;
  let dir: string;
  let filePath: string;
  let ndjsonPath: string;

  const repository = {
    truncateCN52N: vi.fn(),
    getObraIdsByDiagramas: vi.fn(),
    insertCapex: vi.fn(),
  };

  const parser = { parse: vi.fn() };

  const logger = { error: vi.fn(), warn: vi.fn(), log: vi.fn() };

  /** Escreve o NDJSON e configura o parser para o devolver. */
  async function givenParsedRows(rows: Row[], extraLines: string[] = []) {
    const lines = [...rows.map((row) => JSON.stringify(row)), ...extraLines];
    await writeFile(ndjsonPath, lines.join('\n') + '\n', 'utf8');

    parser.parse.mockImplementation(
      async (_file: string, onProgress?: (rowsRead: number) => void) => {
        onProgress?.(rows.length);
        return { totalRows: rows.length, ndjsonPath };
      },
    );
  }

  /** Todos os itens enviados ao insertCapex, independentemente do lote. */
  const insertedItems = () =>
    repository.insertCapex.mock.calls.flatMap(([items]) => items);

  beforeEach(async () => {
    vi.clearAllMocks();

    dir = await mkdtemp(join(tmpdir(), 'capex-spec-'));
    filePath = join(dir, 'upload.xlsx');
    ndjsonPath = join(dir, 'upload.xlsx.ndjson');
    await writeFile(filePath, 'conteúdo irrelevante');

    repository.truncateCN52N.mockResolvedValue(undefined);
    repository.insertCapex.mockResolvedValue(undefined);
    repository.getObraIdsByDiagramas.mockImplementation(
      async (diagramas: string[]) =>
        new Map(
          diagramas
            .filter((d) => OBRAS.has(d))
            .map((d) => [d, OBRAS.get(d) as number[]]),
        ),
    );

    service = new CapexProcessingService(repository as any, parser as any);
    (service as any).logger = logger;
  });

  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  // ============================================================
  // Fase 1 — validação
  // ============================================================

  describe('quando a planilha é inválida', () => {
    const validationError = new BadRequestException(
      'Planilha inválida, nenhum dado foi alterado. linha 3, coluna B (diagrama_rede): tipo de célula não suportado',
    );

    beforeEach(() => {
      parser.parse.mockRejectedValue(validationError);
    });

    it('não altera o banco (sem truncate nem insert)', async () => {
      await expect(service.process(filePath, 'job-1')).rejects.toThrow(
        validationError,
      );

      expect(repository.truncateCN52N).not.toHaveBeenCalled();
      expect(repository.insertCapex).not.toHaveBeenCalled();
    });

    it('emite a fase de erro com a mensagem de validação', async () => {
      const onProgress = vi.fn();

      await expect(
        service.process(filePath, 'job-1', onProgress),
      ).rejects.toThrow();

      expect(onProgress).toHaveBeenLastCalledWith(
        expect.objectContaining({
          phase: 'error',
          percentage: 0,
          message: expect.stringContaining('Planilha inválida'),
        }),
      );
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('job-1'),
        validationError.stack,
      );
    });

    it('remove o arquivo enviado', async () => {
      await expect(service.process(filePath, 'job-1')).rejects.toThrow();

      expect(existsSync(filePath)).toBe(false);
    });
  });

  // ============================================================
  // Fase 2 — carga
  // ============================================================

  describe('quando a planilha é válida', () => {
    it('faz o truncate só depois da validação e antes dos inserts', async () => {
      await givenParsedRows(makeRows(3));

      await service.process(filePath, 'job-1');

      const [parseOrder] = parser.parse.mock.invocationCallOrder;
      const [truncateOrder] = repository.truncateCN52N.mock.invocationCallOrder;
      const [insertOrder] = repository.insertCapex.mock.invocationCallOrder;

      expect(parseOrder).toBeLessThan(truncateOrder);
      expect(truncateOrder).toBeLessThan(insertOrder);
      expect(repository.truncateCN52N).toHaveBeenCalledTimes(1);
    });

    it('vincula cada linha à obra do diagrama', async () => {
      await givenParsedRows([makeRow('D1'), makeRow('D2')]);

      await service.process(filePath, 'job-1');

      expect(insertedItems()).toEqual([
        expect.objectContaining({ diagrama_rede: 'D1', id_obra: 10 }),
        expect.objectContaining({ diagrama_rede: 'D2', id_obra: 20 }),
      ]);
    });

    it('insere em lotes de 1000 linhas', async () => {
      await givenParsedRows(makeRows(2500));

      await service.process(filePath, 'job-1');

      const batchSizes = repository.insertCapex.mock.calls
        .map(([items]) => items.length)
        .sort((a, b) => b - a);

      expect(batchSizes).toEqual([1000, 1000, 500]);
      expect(insertedItems()).toHaveLength(2500);
    });

    it('ignora linhas vazias do NDJSON', async () => {
      await givenParsedRows([makeRow('D1')], ['', '']);

      await service.process(filePath, 'job-1');

      expect(insertedItems()).toHaveLength(1);
    });

    it('consulta cada diagrama uma única vez por lote', async () => {
      await givenParsedRows([makeRow('D1'), makeRow('D1'), makeRow('D2')]);

      await service.process(filePath, 'job-1');

      expect(repository.getObraIdsByDiagramas).toHaveBeenCalledTimes(1);
      expect(repository.getObraIdsByDiagramas).toHaveBeenCalledWith([
        'D1',
        'D2',
      ]);
    });

    it('remove o arquivo enviado e o NDJSON temporário', async () => {
      await givenParsedRows(makeRows(3));

      await service.process(filePath, 'job-1');

      expect(existsSync(filePath)).toBe(false);
      expect(existsSync(ndjsonPath)).toBe(false);
    });
  });

  // ============================================================
  // Linhas ignoradas e ambíguas
  // ============================================================

  describe('linhas sem obra única', () => {
    it('ignora diagramas sem obra e linhas sem diagrama', async () => {
      const onProgress = vi.fn();
      await givenParsedRows([
        makeRow('D1'),
        makeRow('SEM_OBRA'),
        makeRow(null),
      ]);

      await service.process(filePath, 'job-1', onProgress);

      expect(insertedItems()).toHaveLength(1);
      expect(onProgress).toHaveBeenLastCalledWith(
        expect.objectContaining({
          phase: 'completed',
          message: expect.stringContaining('2 ignorados'),
        }),
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('SEM_OBRA'),
      );
    });

    it('não importa diagramas presentes em mais de uma obra', async () => {
      const onProgress = vi.fn();
      await givenParsedRows([makeRow('D1'), makeRow('AMB'), makeRow('AMB')]);

      await service.process(filePath, 'job-1', onProgress);

      expect(insertedItems()).toEqual([
        expect.objectContaining({ diagrama_rede: 'D1' }),
      ]);
      expect(onProgress).toHaveBeenLastCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('2 ambíguos'),
        }),
      );
      expect(logger.warn).toHaveBeenCalledWith(
        expect.stringContaining('ambíguas'),
      );
    });

    it('não chama insertCapex quando nenhuma linha tem obra', async () => {
      await givenParsedRows([makeRow('SEM_OBRA')]);

      await service.process(filePath, 'job-1');

      expect(repository.insertCapex).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Progresso
  // ============================================================

  describe('progresso', () => {
    it('emite as fases pela ordem reading → processing → completed', async () => {
      const onProgress = vi.fn();
      await givenParsedRows(makeRows(2500));

      await service.process(filePath, 'job-1', onProgress);

      const phases = onProgress.mock.calls.map(([event]) => event.phase);
      const firstProcessing = phases.indexOf('processing');

      expect(phases[0]).toBe('reading');
      expect(firstProcessing).toBeGreaterThan(phases.lastIndexOf('reading'));
      expect(phases.at(-1)).toBe('completed');
    });

    it('conclui a validação com 100% e o total de linhas', async () => {
      const onProgress = vi.fn();
      await givenParsedRows(makeRows(3));

      await service.process(filePath, 'job-1', onProgress);

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'reading',
          processed: 3,
          percentage: 100,
        }),
      );
    });

    it('calcula o percentual exato da carga, sem passar de 99%', async () => {
      const onProgress = vi.fn();
      await givenParsedRows(makeRows(2500));

      await service.process(filePath, 'job-1', onProgress);

      const processing = onProgress.mock.calls
        .map(([event]) => event)
        .filter((event) => event.phase === 'processing');

      expect(processing.map((e) => e.percentage)).toEqual([40, 80]);
      expect(processing.map((e) => e.processed)).toEqual([1000, 2000]);
    });

    it('termina com completed a 100%', async () => {
      const onProgress = vi.fn();
      await givenParsedRows(makeRows(3));

      await service.process(filePath, 'job-1', onProgress);

      expect(onProgress).toHaveBeenLastCalledWith(
        expect.objectContaining({
          phase: 'completed',
          processed: 3,
          percentage: 100,
          message: expect.stringContaining('Importação concluída'),
        }),
      );
    });

    it('funciona sem callback de progresso', async () => {
      await givenParsedRows(makeRows(3));

      await expect(service.process(filePath, 'job-1')).resolves.toBeUndefined();
    });
  });

  // ============================================================
  // Falhas durante a carga
  // ============================================================

  describe('quando o insert falha', () => {
    it('relança o erro, emite erro genérico e remove os arquivos', async () => {
      const onProgress = vi.fn();
      const dbError = new Error('connection terminated: host=10.0.0.1');
      repository.insertCapex.mockRejectedValue(dbError);
      await givenParsedRows(makeRows(2500));

      await expect(
        service.process(filePath, 'job-1', onProgress),
      ).rejects.toThrow(dbError);

      const lastEvent = onProgress.mock.calls.at(-1)?.[0];
      expect(lastEvent).toMatchObject({ phase: 'error', percentage: 0 });
      // detalhes internos não chegam ao cliente
      expect(lastEvent.message).not.toContain('10.0.0.1');

      expect(existsSync(filePath)).toBe(false);
      expect(existsSync(ndjsonPath)).toBe(false);
    });

    it('não emite completed depois da falha', async () => {
      const onProgress = vi.fn();
      repository.insertCapex.mockRejectedValue(new Error('DB error'));
      await givenParsedRows(makeRows(3));

      await expect(
        service.process(filePath, 'job-1', onProgress),
      ).rejects.toThrow();

      const phases = onProgress.mock.calls.map(([event]) => event.phase);
      expect(phases).not.toContain('completed');
    });
  });

  // ============================================================
  // Limpeza de arquivos
  // ============================================================

  it('não falha se o arquivo enviado já tiver sido removido', async () => {
    await givenParsedRows(makeRows(1));
    await rm(filePath);

    await expect(service.process(filePath, 'job-1')).resolves.toBeUndefined();

    expect(logger.warn).toHaveBeenCalledWith(
      expect.stringContaining('Não foi possível remover'),
    );
  });

  // ============================================================
  // estimateReadingPercentage (private)
  // ============================================================

  describe('estimateReadingPercentage', () => {
    const estimate = (rows: number): number =>
      (service as any).estimateReadingPercentage(rows);

    it('começa em 0', () => {
      expect(estimate(0)).toBe(0);
    });

    it('nunca passa de 99', () => {
      expect(estimate(10_000_000)).toBe(99);
    });

    it('é crescente', () => {
      const values = [1_000, 10_000, 60_000, 200_000].map(estimate);

      values.forEach((value, i) => {
        if (i > 0) expect(value).toBeGreaterThanOrEqual(values[i - 1]);
      });
    });
  });
});
