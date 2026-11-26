import {
  parseStoredNames,
  storedFilesOf,
} from 'src/infra/mappers/executionReport.mapper';
import { describe, expect, it } from 'vitest';

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
});
