import {
  CapexWorkerInput,
  CapexWorkerMessage,
  runCapexParser,
} from 'src/infra/spreadsheet/capex/capexFileParser.worker';
import { CapexRowError } from 'src/infra/spreadsheet/capex/capexRow.mapper';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from 'vitest';

type Row = { number: number; values: unknown[] };
type Mapped = { empty: boolean; errors: CapexRowError[]; item?: unknown };

// ─── Shared mock state (hoisted so the vi.mock factories can use it) ──
const h = vi.hoisted(() => ({
  headerRows: 2,
  sheets: [] as Row[][],
  sheetsOpened: 0,
  readerCtor: vi.fn(),
  open: vi.fn(),
  handle: { write: vi.fn(), close: vi.fn() },
  loadSharedStrings: vi.fn(),
  resolveSharedStrings: vi.fn(),
  mapCapexRow: vi.fn(),
  worker: {
    isMainThread: true,
    parentPort: null as unknown,
    workerData: undefined as unknown,
  },
}));

vi.mock('exceljs', () => {
  class WorkbookReader {
    constructor(...args: unknown[]) {
      h.readerCtor(...args);
    }

    async *[Symbol.asyncIterator]() {
      for (const rows of h.sheets) {
        h.sheetsOpened++;
        yield {
          async *[Symbol.asyncIterator]() {
            yield* rows;
          },
        };
      }
    }
  }
  const stream = { xlsx: { WorkbookReader } };
  return { stream, default: { stream } };
});

vi.mock('node:fs/promises', () => ({ open: h.open }));

vi.mock('src/infra/spreadsheet/capex/capexRow.mapper', () => ({
  CAPEX_HEADER_ROWS: h.headerRows,
  mapCapexRow: h.mapCapexRow,
}));

vi.mock('src/infra/spreadsheet/capex/sharedStrings', () => ({
  loadSharedStrings: h.loadSharedStrings,
  resolveSharedStrings: h.resolveSharedStrings,
}));

// Required: Vitest itself may run tests inside worker threads, where the real
// isMainThread is false and parentPort exists. Without this mock, importing
// the module would start the parser with Vitest's own workerData.
vi.mock('node:worker_threads', () => ({
  get isMainThread() {
    return h.worker.isMainThread;
  },
  get parentPort() {
    return h.worker.parentPort;
  },
  get workerData() {
    return h.worker.workerData;
  },
}));

// Mirror the module constants (they are not exported).
const PROGRESS_EVERY_ROWS = 5000;
const WRITE_BUFFER_BYTES = 1_000_000;
const SHARED_STRINGS = ['shared-0', 'shared-1'];

// ─── Helpers ────────────────────────────────────────────────────────
const input = (
  overrides: Partial<CapexWorkerInput> = {},
): CapexWorkerInput => ({
  filePath: '/tmp/input.xlsx',
  outputPath: '/tmp/output.jsonl',
  maxRows: 100_000,
  maxErrors: 50,
  ...overrides,
});

const run = async (overrides: Partial<CapexWorkerInput> = {}) => {
  const post = vi.fn<(message: CapexWorkerMessage) => void>();
  await runCapexParser(input(overrides), post);
  return post;
};

const row = (number: number): Row => ({
  number,
  values: [undefined, `A${number}`],
});

/** Sheet with the header rows followed by `count` data rows. */
const sheetWith = (count: number): Row[] =>
  Array.from({ length: h.headerRows + count }, (_, i) => row(i + 1));

/** Row number of the n-th data row (1-based). */
const dataRow = (n: number) => h.headerRows + n;

const ok = (n: number, item: unknown = { row: n }): Mapped => ({
  empty: false,
  errors: [],
  item,
});
const empty = (): Mapped => ({ empty: true, errors: [] });
const err = (n: number, message = 'invalid value'): CapexRowError =>
  ({ row: n, column: 'B', message }) as CapexRowError;
const invalid = (...errors: CapexRowError[]): Mapped => ({
  empty: false,
  errors,
});

/** Overrides the mapper result for specific row numbers (others are valid). */
const mapByRow = (map: Record<number, Mapped>) =>
  h.mapCapexRow.mockImplementation(
    (_values: unknown, n: number) => map[n] ?? ok(n),
  );

const allInvalid = () =>
  h.mapCapexRow.mockImplementation((_values: unknown, n: number) =>
    invalid(err(n)),
  );

const written = () =>
  h.handle.write.mock.calls.map(([chunk]) => chunk as string).join('');

const writtenLines = () =>
  written()
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line));

// ─── Suite ──────────────────────────────────────────────────────────
beforeEach(() => {
  vi.resetAllMocks();
  h.sheets = [];
  h.sheetsOpened = 0;

  h.loadSharedStrings.mockResolvedValue(SHARED_STRINGS);
  h.resolveSharedStrings.mockImplementation((values: unknown[]) => [
    ...values,
    'resolved',
  ]);
  h.mapCapexRow.mockImplementation((_values: unknown, n: number) => ok(n));
  h.open.mockResolvedValue(h.handle);
  h.handle.write.mockResolvedValue(undefined);
  h.handle.close.mockResolvedValue(undefined);
});

describe('runCapexParser', () => {
  // ───────────────────────────────────────────────────────────────────
  describe('setup', () => {
    it('loads the shared strings before opening the output file', async () => {
      h.sheets = [sheetWith(1)];

      await run();

      expect(h.loadSharedStrings).toHaveBeenCalledWith('/tmp/input.xlsx');
      expect(h.open).toHaveBeenCalledWith('/tmp/output.jsonl', 'w');
      expect(h.loadSharedStrings.mock.invocationCallOrder[0]).toBeLessThan(
        h.open.mock.invocationCallOrder[0],
      );
    });

    it('creates the streaming reader with the expected options', async () => {
      h.sheets = [sheetWith(1)];

      await run();

      expect(h.readerCtor).toHaveBeenCalledWith('/tmp/input.xlsx', {
        entries: 'emit',
        sharedStrings: 'cache',
        hyperlinks: 'emit',
        worksheets: 'emit',
      });
    });

    it('does not open the output when loading the shared strings fails', async () => {
      h.loadSharedStrings.mockRejectedValueOnce(new Error('corrupted zip'));

      await expect(run()).rejects.toThrow('corrupted zip');

      expect(h.open).not.toHaveBeenCalled();
      expect(h.readerCtor).not.toHaveBeenCalled();
    });

    it('does not read the workbook when opening the output fails', async () => {
      h.open.mockRejectedValueOnce(new Error('EACCES'));

      await expect(run()).rejects.toThrow('EACCES');

      expect(h.readerCtor).not.toHaveBeenCalled();
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('row processing', () => {
    it('skips the header rows', async () => {
      h.sheets = [sheetWith(2)];

      await run();

      expect(h.mapCapexRow).toHaveBeenCalledTimes(2);
      expect(h.mapCapexRow.mock.calls.map(([, n]) => n)).toEqual([
        dataRow(1),
        dataRow(2),
      ]);
    });

    it('resolves the shared strings before mapping each row', async () => {
      const [, , first] = (h.sheets = [sheetWith(1)])[0];

      await run();

      expect(h.resolveSharedStrings).toHaveBeenCalledWith(
        first.values,
        SHARED_STRINGS,
      );
      expect(h.mapCapexRow).toHaveBeenCalledWith(
        [...first.values, 'resolved'],
        first.number,
      );
    });

    it('writes valid rows as JSON lines and posts done', async () => {
      h.sheets = [sheetWith(3)];

      const post = await run();

      expect(writtenLines()).toEqual([
        { row: dataRow(1) },
        { row: dataRow(2) },
        { row: dataRow(3) },
      ]);
      expect(written().endsWith('\n')).toBe(true);
      expect(post).toHaveBeenCalledTimes(1);
      expect(post).toHaveBeenCalledWith({ type: 'done', totalRows: 3 });
      expect(h.handle.close).toHaveBeenCalledTimes(1);
    });

    it('ignores empty rows without counting them', async () => {
      h.sheets = [sheetWith(3)];
      mapByRow({ [dataRow(2)]: empty() });

      const post = await run();

      expect(writtenLines()).toEqual([
        { row: dataRow(1) },
        { row: dataRow(3) },
      ]);
      expect(post).toHaveBeenCalledWith({ type: 'done', totalRows: 2 });
    });

    it('reads every worksheet', async () => {
      h.sheets = [sheetWith(2), sheetWith(3)];

      const post = await run();

      expect(h.sheetsOpened).toBe(2);
      expect(post).toHaveBeenCalledWith({ type: 'done', totalRows: 5 });
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('output buffering', () => {
    it('writes small outputs in a single final flush', async () => {
      h.sheets = [sheetWith(3)];

      await run();

      expect(h.handle.write).toHaveBeenCalledTimes(1);
    });

    it('flushes early when the buffer reaches 1 MB', async () => {
      const big = { data: 'x'.repeat(WRITE_BUFFER_BYTES) };
      h.sheets = [sheetWith(2)];
      mapByRow({ [dataRow(1)]: ok(dataRow(1), big) });

      await run();

      expect(h.handle.write).toHaveBeenCalledTimes(2);
      expect(h.handle.write.mock.calls[0][0]).toBe(`${JSON.stringify(big)}\n`);
      expect(h.handle.write.mock.calls[1][0]).toBe(
        `${JSON.stringify({ row: dataRow(2) })}\n`,
      );
    });

    it('skips the final flush when the buffer is already empty', async () => {
      const big = { data: 'x'.repeat(WRITE_BUFFER_BYTES) };
      h.sheets = [sheetWith(1)];
      mapByRow({ [dataRow(1)]: ok(dataRow(1), big) });

      await run();

      expect(h.handle.write).toHaveBeenCalledTimes(1);
    });

    it('does not write anything when there are no valid rows', async () => {
      h.sheets = [sheetWith(2)];
      allInvalid();

      await run();

      expect(h.handle.write).not.toHaveBeenCalled();
      expect(h.handle.close).toHaveBeenCalledTimes(1);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('progress', () => {
    it(`posts progress every ${PROGRESS_EVERY_ROWS} rows`, async () => {
      h.sheets = [sheetWith(PROGRESS_EVERY_ROWS * 2)];

      const post = await run();

      expect(post.mock.calls.map(([m]) => m)).toEqual([
        { type: 'progress', rowsRead: PROGRESS_EVERY_ROWS },
        { type: 'progress', rowsRead: PROGRESS_EVERY_ROWS * 2 },
        { type: 'done', totalRows: PROGRESS_EVERY_ROWS * 2 },
      ]);
    });

    it('does not post progress below the threshold', async () => {
      h.sheets = [sheetWith(PROGRESS_EVERY_ROWS - 1)];

      const post = await run();

      expect(post).toHaveBeenCalledTimes(1);
      expect(post).toHaveBeenCalledWith(
        expect.objectContaining({ type: 'done' }),
      );
    });

    it('does not count empty rows towards progress', async () => {
      h.sheets = [sheetWith(PROGRESS_EVERY_ROWS)];
      mapByRow({ [dataRow(10)]: empty() });

      const post = await run();

      expect(post).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'progress' }),
      );
      expect(post).toHaveBeenCalledWith({
        type: 'done',
        totalRows: PROGRESS_EVERY_ROWS - 1,
      });
    });

    it('skips progress when the threshold row is invalid (current behaviour)', async () => {
      h.sheets = [sheetWith(PROGRESS_EVERY_ROWS)];
      mapByRow({ [dataRow(PROGRESS_EVERY_ROWS)]: invalid(err(1)) });

      const post = await run();

      expect(post).not.toHaveBeenCalledWith(
        expect.objectContaining({ type: 'progress' }),
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('row limit', () => {
    it('accepts exactly maxRows rows', async () => {
      h.sheets = [sheetWith(3)];

      const post = await run({ maxRows: 3 });

      expect(post).toHaveBeenCalledWith({ type: 'done', totalRows: 3 });
    });

    it('stops reading and posts invalid when the limit is exceeded', async () => {
      h.sheets = [sheetWith(5), sheetWith(5)];

      const post = await run({ maxRows: 3 });

      expect(h.mapCapexRow).toHaveBeenCalledTimes(4);
      expect(h.sheetsOpened).toBe(1);
      expect(h.handle.close).toHaveBeenCalledTimes(1);
      expect(post).toHaveBeenCalledTimes(1);
      expect(post).toHaveBeenCalledWith({
        type: 'invalid',
        totalRows: 4, // maxRows + 1 (current behaviour)
        errors: [
          {
            row: 0,
            column: '-',
            message: 'a planilha excede o limite de 3 linhas',
          },
        ],
      });
    });

    it('reports only the limit error even when rows had errors', async () => {
      h.sheets = [sheetWith(3)];
      allInvalid();

      const post = await run({ maxRows: 2 });

      expect(post).toHaveBeenCalledWith({
        type: 'invalid',
        totalRows: 3,
        errors: [
          expect.objectContaining({
            message: 'a planilha excede o limite de 2 linhas',
          }),
        ],
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('validation errors', () => {
    it('collects the errors and posts invalid', async () => {
      h.sheets = [sheetWith(3)];
      mapByRow({
        [dataRow(1)]: invalid(err(dataRow(1), 'missing value')),
        [dataRow(3)]: invalid(err(dataRow(3), 'invalid date')),
      });

      const post = await run();

      expect(post).toHaveBeenCalledTimes(1);
      expect(post).toHaveBeenCalledWith({
        type: 'invalid',
        totalRows: 3,
        errors: [
          err(dataRow(1), 'missing value'),
          err(dataRow(3), 'invalid date'),
        ],
      });
    });

    it('does not write invalid rows, but keeps the valid ones (current behaviour)', async () => {
      h.sheets = [sheetWith(3)];
      mapByRow({ [dataRow(2)]: invalid(err(dataRow(2))) });

      await run();

      expect(writtenLines()).toEqual([
        { row: dataRow(1) },
        { row: dataRow(3) },
      ]);
    });

    it('stops reading once maxErrors is reached', async () => {
      h.sheets = [sheetWith(5), sheetWith(5)];
      allInvalid();

      const post = await run({ maxErrors: 2 });

      expect(h.mapCapexRow).toHaveBeenCalledTimes(2);
      expect(h.sheetsOpened).toBe(1);
      expect(post).toHaveBeenCalledWith({
        type: 'invalid',
        totalRows: 2,
        errors: [err(dataRow(1)), err(dataRow(2))],
      });
    });

    it('truncates the errors to maxErrors when a single row has more', async () => {
      h.sheets = [sheetWith(2)];
      mapByRow({
        [dataRow(1)]: invalid(err(1, 'e1'), err(1, 'e2'), err(1, 'e3')),
      });

      const post = await run({ maxErrors: 2 });

      expect(h.mapCapexRow).toHaveBeenCalledTimes(1);
      expect(post).toHaveBeenCalledWith({
        type: 'invalid',
        totalRows: 1,
        errors: [err(1, 'e1'), err(1, 'e2')],
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('no data', () => {
    const noData = {
      type: 'invalid',
      totalRows: 0,
      errors: [
        {
          row: 0,
          column: '-',
          message: 'a planilha não possui linhas de dados',
        },
      ],
    };

    it('posts invalid when the workbook has no worksheets', async () => {
      const post = await run();

      expect(post).toHaveBeenCalledWith(noData);
    });

    it('posts invalid when there are only header rows', async () => {
      h.sheets = [sheetWith(0)];

      const post = await run();

      expect(h.mapCapexRow).not.toHaveBeenCalled();
      expect(post).toHaveBeenCalledWith(noData);
    });

    it('posts invalid when every data row is empty', async () => {
      h.sheets = [sheetWith(3)];
      h.mapCapexRow.mockReturnValue(empty());

      const post = await run();

      expect(post).toHaveBeenCalledWith(noData);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('failures', () => {
    it('closes the output and rejects when reading fails', async () => {
      h.sheets = [sheetWith(2)];
      h.mapCapexRow.mockImplementationOnce(() => {
        throw new Error('mapper exploded');
      });

      const post = vi.fn();
      await expect(runCapexParser(input(), post)).rejects.toThrow(
        'mapper exploded',
      );

      expect(h.handle.close).toHaveBeenCalledTimes(1);
      expect(post).not.toHaveBeenCalled();
    });

    it('closes the output and rejects when writing fails', async () => {
      h.sheets = [sheetWith(1)];
      h.handle.write.mockRejectedValueOnce(new Error('disk full'));

      const post = vi.fn();
      await expect(runCapexParser(input(), post)).rejects.toThrow('disk full');

      expect(h.handle.close).toHaveBeenCalledTimes(1);
      expect(post).not.toHaveBeenCalled();
    });
  });
});

// ─────────────────────────────────────────────────────────────────────
describe('worker bootstrap', () => {
  const workerInput = input({
    filePath: '/worker/input.xlsx',
    outputPath: '/worker/output.jsonl',
  });
  let port: { postMessage: Mock };

  /** Re-imports the module so the top-level bootstrap runs again. */
  const load = async (state: Partial<typeof h.worker>) => {
    Object.assign(h.worker, state);
    vi.resetModules();
    await import('src/infra/spreadsheet/capex/capexFileParser.worker.js');
  };

  const settle = () => new Promise((resolve) => setImmediate(resolve));

  beforeEach(() => {
    port = { postMessage: vi.fn() };
    h.sheets = [sheetWith(1)];
  });

  afterEach(() => {
    Object.assign(h.worker, {
      isMainThread: true,
      parentPort: null,
      workerData: undefined,
    });
  });

  it('does nothing on the main thread', async () => {
    await load({
      isMainThread: true,
      parentPort: port,
      workerData: workerInput,
    });
    await settle();

    expect(h.loadSharedStrings).not.toHaveBeenCalled();
    expect(port.postMessage).not.toHaveBeenCalled();
  });

  it('does nothing when there is no parentPort', async () => {
    await load({
      isMainThread: false,
      parentPort: null,
      workerData: workerInput,
    });
    await settle();

    expect(h.loadSharedStrings).not.toHaveBeenCalled();
  });

  it('runs the parser with workerData and forwards messages to parentPort', async () => {
    await load({
      isMainThread: false,
      parentPort: port,
      workerData: workerInput,
    });

    await vi.waitFor(() =>
      expect(port.postMessage).toHaveBeenCalledWith({
        type: 'done',
        totalRows: 1,
      }),
    );
    expect(h.loadSharedStrings).toHaveBeenCalledWith('/worker/input.xlsx');
    expect(h.open).toHaveBeenCalledWith('/worker/output.jsonl', 'w');
  });

  it('posts a fatal message with the error message when the parser throws an Error', async () => {
    h.loadSharedStrings.mockRejectedValueOnce(new Error('corrupted file'));

    await load({
      isMainThread: false,
      parentPort: port,
      workerData: workerInput,
    });

    await vi.waitFor(() =>
      expect(port.postMessage).toHaveBeenCalledWith({
        type: 'fatal',
        message: 'corrupted file',
      }),
    );
  });

  it('stringifies non-Error rejections in the fatal message', async () => {
    h.loadSharedStrings.mockRejectedValueOnce('boom');

    await load({
      isMainThread: false,
      parentPort: port,
      workerData: workerInput,
    });

    await vi.waitFor(() =>
      expect(port.postMessage).toHaveBeenCalledWith({
        type: 'fatal',
        message: 'boom',
      }),
    );
  });
});
