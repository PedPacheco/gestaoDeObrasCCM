import {
  parseStoredNames,
  storedFilesOf,
  uploadedPaths,
} from 'src/shared/upload/storedFileName';
import { describe, expect, it } from 'vitest';

const makeFile = (
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File =>
  ({
    fieldname: 'file',
    originalname: 'file',
    encoding: '7bit',
    mimetype: 'application/octet-stream',
    size: 0,
    ...overrides,
  }) as Express.Multer.File;

describe('stored-files', () => {
  // ---------------------------------------------------------------------------
  describe('parseStoredNames', () => {
    it.each([
      ['undefined', undefined],
      ['null', null],
      ['an empty string', ''],
    ])('returns [] for %s', (_, value) => {
      expect(parseStoredNames(value)).toEqual([]);
    });

    it('returns [] when called without arguments', () => {
      expect(parseStoredNames()).toEqual([]);
    });

    it('returns a single name when there is no separator', () => {
      expect(parseStoredNames('a.pdf')).toEqual(['a.pdf']);
    });

    it('splits multiple names on ";"', () => {
      expect(parseStoredNames('a.pdf;b.png;c.xlsx')).toEqual([
        'a.pdf',
        'b.png',
        'c.xlsx',
      ]);
    });

    it('trims whitespace around each name', () => {
      expect(parseStoredNames('  a.pdf ;\tb.png\n ')).toEqual([
        'a.pdf',
        'b.png',
      ]);
    });

    it('preserves inner whitespace in names', () => {
      expect(parseStoredNames(' my file.pdf ')).toEqual(['my file.pdf']);
    });

    it('drops empty entries (repeated, leading or trailing separators)', () => {
      expect(parseStoredNames(';a.pdf;;b.png;')).toEqual(['a.pdf', 'b.png']);
    });

    it('drops whitespace-only entries', () => {
      expect(parseStoredNames('a.pdf;   ;b.png')).toEqual(['a.pdf', 'b.png']);
    });

    it('returns [] when there are only separators and whitespace', () => {
      expect(parseStoredNames(' ; ;; ')).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  describe('storedFilesOf', () => {
    it('uses caminhos_arquivos when it is not empty', () => {
      const paths = ['x.pdf', 'y.png'];

      const result = storedFilesOf({
        caminhos_arquivos: paths,
        caminho_arquivo: 'ignored.pdf',
      });

      expect(result).toEqual(['x.pdf', 'y.png']);
      expect(result).toBe(paths); // returns the same reference
    });

    it.each([
      ['undefined', undefined],
      ['null', null],
      ['an empty array', []],
    ])(
      'falls back to caminho_arquivo when caminhos_arquivos is %s',
      (_, caminhos_arquivos) => {
        expect(
          storedFilesOf({
            caminhos_arquivos,
            caminho_arquivo: 'a.pdf; b.png',
          }),
        ).toEqual(['a.pdf', 'b.png']);
      },
    );

    it('falls back to caminho_arquivo when caminhos_arquivos is missing from the row', () => {
      expect(storedFilesOf({ caminho_arquivo: 'a.pdf' })).toEqual(['a.pdf']);
    });

    it.each([
      ['empty object', {}],
      ['both null', { caminhos_arquivos: null, caminho_arquivo: null }],
      [
        'empty array and empty string',
        { caminhos_arquivos: [], caminho_arquivo: '' },
      ],
    ])('returns [] when there are no files (%s)', (_, row) => {
      expect(storedFilesOf(row)).toEqual([]);
    });
  });

  // ---------------------------------------------------------------------------
  describe('uploadedPaths', () => {
    it('returns [] when called without arguments', () => {
      expect(uploadedPaths()).toEqual([]);
    });

    it('returns [] for undefined', () => {
      expect(uploadedPaths(undefined)).toEqual([]);
    });

    it('returns [] for an empty array', () => {
      expect(uploadedPaths([])).toEqual([]);
    });

    it('accepts a single (non-array) file with a path', () => {
      expect(uploadedPaths(makeFile({ path: '/tmp/a.pdf' }))).toEqual([
        '/tmp/a.pdf',
      ]);
    });

    it('returns [] for a single memoryStorage file (no path)', () => {
      expect(uploadedPaths(makeFile({ buffer: Buffer.from('x') }))).toEqual([]);
    });

    it('returns the paths of an array of files, preserving order', () => {
      expect(
        uploadedPaths([
          makeFile({ path: '/tmp/a.pdf' }),
          makeFile({ path: '/tmp/b.png' }),
        ]),
      ).toEqual(['/tmp/a.pdf', '/tmp/b.png']);
    });

    it('ignores files without a path (memoryStorage) or with an empty path', () => {
      expect(
        uploadedPaths([
          makeFile({ path: '/tmp/a.pdf' }),
          makeFile({ buffer: Buffer.from('x') }),
          makeFile({ path: '' }),
          makeFile({ path: '/tmp/b.png' }),
        ]),
      ).toEqual(['/tmp/a.pdf', '/tmp/b.png']);
    });

    it('returns [] when all files are in memory', () => {
      expect(
        uploadedPaths([
          makeFile({ buffer: Buffer.from('a') }),
          makeFile({ buffer: Buffer.from('b') }),
        ]),
      ).toEqual([]);
    });
  });
});
