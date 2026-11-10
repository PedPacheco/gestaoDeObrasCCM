import { BadRequestException } from '@nestjs/common';
import * as fs from 'fs';
import {
  createFileFilter,
  createMulterConfig,
  fixFilenameEncoding,
  MulterConfig,
  normalizedExt,
  safeFilename,
  sanitizeBaseName,
} from 'src/shared/multer/multer.config';
import type { Mock } from 'vitest';

vi.mock('fs');

// Sufixo aleatório: UUID sem hífens
const HEX32 = '[0-9a-f]{32}';
// Mesma regex do FilesController (PR 3)
const SAFE_NAME = /^[A-Za-z0-9_-]+\.[A-Za-z0-9]{2,5}$/;

const baseConfig: MulterConfig = {
  destination: '/uploads',
  allowedMimeTypes: ['image/png', 'application/pdf'],
  allowedExtensions: ['.png', '.pdf'],
  maxSize: 5 * 1024 * 1024,
  maxFiles: 3,
};

/** Corre o fileFilter da config e devolve o callback para as asserções. */
const runFilter = (
  originalname: string | undefined,
  mimetype: string | undefined,
) => {
  const callback = vi.fn();
  const filter = createFileFilter(baseConfig);
  filter(
    {} as any,
    { originalname, mimetype } as Express.Multer.File,
    callback,
  );
  return callback;
};

const expectRejected = (callback: Mock) => {
  expect(callback.mock.calls[0][0]).toBeInstanceOf(BadRequestException);
  expect(callback.mock.calls[0][1]).toBe(false);
};

describe('createMulterConfig', () => {
  const existsSync = fs.existsSync as Mock;
  const mkdirSync = fs.mkdirSync as Mock;

  beforeEach(() => {
    vi.clearAllMocks();
    existsSync.mockReturnValue(true);
  });

  // ── Pasta de destino ───────────────────────────────────────────────
  it('should create directory if not existing', () => {
    existsSync.mockReturnValue(false);
    createMulterConfig(baseConfig);
    expect(mkdirSync).toHaveBeenCalledWith('/uploads', { recursive: true });
  });

  it('should NOT create directory if it already exists', () => {
    createMulterConfig(baseConfig);
    expect(mkdirSync).not.toHaveBeenCalled();
  });

  it('should throw error if config is not sent', () => {
    expect(() =>
      createMulterConfig(undefined as unknown as MulterConfig),
    ).toThrow('Multer destination was not provided');
  });

  it('should throw error if destination is empty', () => {
    expect(() =>
      createMulterConfig({ ...baseConfig, destination: '' }),
    ).toThrow('Multer destination was not provided');
  });

  it('should configure destination correctly', () => {
    const config = createMulterConfig(baseConfig);
    const callback = vi.fn();
    const storage: any = config.storage;

    storage.getDestination({}, {} as any, callback);

    expect(callback).toHaveBeenCalledWith(null, '/uploads');
  });

  // ── Nome do ficheiro (via storage) ─────────────────────────────────
  it('should generate sanitized and unique filename', () => {
    const config = createMulterConfig(baseConfig);
    const callback = vi.fn();
    const storage: any = config.storage;

    storage.getFilename(
      {},
      { originalname: 'meu arqùivo 2024@#.pdf' } as any,
      callback,
    );

    const generatedName: string = callback.mock.calls[0][1];
    expect(callback.mock.calls[0][0]).toBeNull();
    expect(generatedName).toMatch(
      new RegExp(`^meu_arquivo_2024-${HEX32}\\.pdf$`),
    );
  });

  // ── fileFilter (via config) ────────────────────────────────────────
  it('should accept allowed extension + mimetype', () => {
    const config = createMulterConfig(baseConfig);
    const callback = vi.fn();

    config.fileFilter(
      {} as any,
      { originalname: 'foto.png', mimetype: 'image/png' } as any,
      callback,
    );

    expect(callback).toHaveBeenCalledWith(null, true);
  });

  it('should reject disallowed mimetype', () => {
    const config = createMulterConfig(baseConfig);
    const callback = vi.fn();

    config.fileFilter(
      {} as any,
      { originalname: 'foto.png', mimetype: 'text/plain' } as any,
      callback,
    );

    expectRejected(callback);
  });

  // ── Limites ────────────────────────────────────────────────────────
  it('should set multer limits correctly', () => {
    const config = createMulterConfig(baseConfig);

    expect(config.limits).toEqual({
      fileSize: baseConfig.maxSize,
      files: baseConfig.maxFiles,
      fields: 30,
      fieldSize: 1024 * 1024,
    });
  });
});

describe('createFileFilter', () => {
  it('accepts uppercase extension and mimetype', () => {
    expect(runFilter('FOTO.PNG', 'IMAGE/PNG')).toHaveBeenCalledWith(null, true);
  });

  it('rejects disallowed extension even with allowed mimetype (HTML as PNG)', () => {
    expectRejected(runFilter('evil.html', 'image/png'));
  });

  it('rejects allowed extension with disallowed mimetype', () => {
    expectRejected(runFilter('fake.png', 'text/html'));
  });

  it('rejects double extension ending in a disallowed one', () => {
    expectRejected(runFilter('fatura.pdf.html', 'application/pdf'));
  });

  it('rejects file without extension', () => {
    expectRejected(runFilter('arquivo', 'application/pdf'));
  });

  it('rejects when originalname or mimetype are missing', () => {
    expectRejected(runFilter(undefined, 'application/pdf'));
    expectRejected(runFilter('foto.png', undefined));
  });
});

describe('normalizedExt', () => {
  it('returns lowercase extension with dot', () => {
    expect(normalizedExt('Foto.PNG')).toBe('.png');
  });

  it('returns empty string without extension or name', () => {
    expect(normalizedExt('arquivo')).toBe('');
    expect(normalizedExt(undefined)).toBe('');
  });
});

describe('sanitizeBaseName', () => {
  it('removes accents and symbols', () => {
    expect(sanitizeBaseName('Relatório Final (v2).pdf')).toBe(
      'Relatorio_Final_v2',
    );
  });

  it('removes only the last extension', () => {
    expect(sanitizeBaseName('relatorio.v2.pdf')).toBe('relatorio_v2');
  });

  it('limits the length to 80 characters', () => {
    expect(sanitizeBaseName(`${'a'.repeat(300)}.pdf`)).toHaveLength(80);
  });

  it('falls back to "arquivo" when the name has only symbols', () => {
    expect(sanitizeBaseName('###.png')).toBe('arquivo');
    expect(sanitizeBaseName('')).toBe('arquivo');
  });
});

describe('fixFilenameEncoding', () => {
  it('fixes a name received as latin1', () => {
    const latin1 = Buffer.from('Relatório.pdf', 'utf8').toString('latin1'); // "RelatÃ³rio.pdf"
    expect(fixFilenameEncoding(latin1)).toBe('Relatório.pdf');
  });

  it('keeps a name that is already UTF-8', () => {
    expect(fixFilenameEncoding('Relatório.pdf')).toBe('Relatório.pdf');
  });

  it('keeps plain ASCII names unchanged', () => {
    expect(fixFilenameEncoding('relatorio.pdf')).toBe('relatorio.pdf');
  });
});

describe('safeFilename', () => {
  it('generates readable name + random suffix + normalized extension', () => {
    expect(safeFilename('Relatório Final.PDF')).toMatch(
      new RegExp(`^Relatorio_Final-${HEX32}\\.pdf$`),
    );
  });

  it('handles names received as latin1', () => {
    const latin1 = Buffer.from('Relatório.pdf', 'utf8').toString('latin1');
    expect(safeFilename(latin1)).toMatch(
      new RegExp(`^Relatorio-${HEX32}\\.pdf$`),
    );
  });

  it('does not allow path traversal', () => {
    const name = safeFilename('../../etc/passwd.pdf');
    expect(name).not.toContain('/');
    expect(name).not.toContain('\\');
    expect(name).not.toContain('..');
  });

  it('is compatible with the FilesController SAFE_NAME regex', () => {
    expect(safeFilename('Relatório Final (v2).pdf')).toMatch(SAFE_NAME);
    expect(safeFilename('###.png')).toMatch(SAFE_NAME);
  });

  it('generates different names for the same input', () => {
    expect(safeFilename('a.pdf')).not.toBe(safeFilename('a.pdf'));
  });
});
