import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import JSZip from 'jszip';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import {
  isSharedStringRef,
  loadSharedStrings,
  parseSharedStringsXml,
  resolveSharedStrings,
} from 'src/infra/spreadsheet/capex/sharedStrings';

const NS = 'http://schemas.openxmlformats.org/spreadsheetml/2006/main';
const INVALID_XML = /^sharedStrings\.xml inválido: /;

// ─── Helpers ────────────────────────────────────────────────────────
/** Builds a sharedStrings.xml document like the one Excel/SAP writes. */
const sst = (...items: string[]) =>
  '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>' +
  `<sst xmlns="${NS}" count="${items.length}" uniqueCount="${items.length}">` +
  items.join('') +
  '</sst>';

/** A plain <si> entry. */
const si = (text: string) => `<si><t>${text}</t></si>`;

const SHEET_XML =
  `<worksheet xmlns="${NS}"><sheetData>` +
  '<row r="1"><c r="A1" t="s"><v>0</v></c></row>' +
  '</sheetData></worksheet>';

// ─── Suite ──────────────────────────────────────────────────────────
describe('sharedStrings', () => {
  // ───────────────────────────────────────────────────────────────────
  describe('isSharedStringRef', () => {
    it.each([
      ['index 0', { sharedString: 0 }],
      ['positive index', { sharedString: 3 }],
      ['object with extra properties', { sharedString: 1, extra: 'x' }],
      [
        'NaN index (typeof number, current behaviour)',
        { sharedString: Number.NaN },
      ],
    ])('returns true for %s', (_, value) => {
      expect(isSharedStringRef(value)).toBe(true);
    });

    it.each([
      ['null', null],
      ['undefined', undefined],
      ['string', 'text'],
      ['number', 42],
      ['boolean', true],
      ['Date', new Date()],
      ['empty object', {}],
      ['array', [0]],
      ['string index', { sharedString: '1' }],
      ['null index', { sharedString: null }],
      ['formula cell', { formula: 'A1', result: 1 }],
    ])('returns false for %s', (_, value) => {
      expect(isSharedStringRef(value)).toBe(false);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('parseSharedStringsXml', () => {
    describe('plain entries', () => {
      it('returns the strings in <si> order', () => {
        expect(
          parseSharedStringsXml(sst(si('CABO'), si('POSTE'), si('M'))),
        ).toEqual(['CABO', 'POSTE', 'M']);
      });

      it('returns [] for a table without entries', () => {
        expect(parseSharedStringsXml(`<sst xmlns="${NS}" count="0"/>`)).toEqual(
          [],
        );
      });

      it('keeps empty entries so the indexes stay aligned', () => {
        expect(
          parseSharedStringsXml(
            sst(si('A'), '<si><t/></si>', '<si/>', si('B')),
          ),
        ).toEqual(['A', '', '', 'B']);
      });

      it('preserves whitespace and line breaks inside <t>', () => {
        expect(
          parseSharedStringsXml(
            sst('<si><t xml:space="preserve">  line 1\nline 2  </t></si>'),
          ),
        ).toEqual(['  line 1\nline 2  ']);
      });

      it('decodes XML entities', () => {
        expect(
          parseSharedStringsXml(
            sst(si('A &amp; B &lt;C&gt; &quot;D&quot; &#233;')),
          ),
        ).toEqual(['A & B <C> "D" é']);
      });

      it('reads CDATA sections', () => {
        expect(
          parseSharedStringsXml(sst('<si><t><![CDATA[a < b & c]]></t></si>')),
        ).toEqual(['a < b & c']);
      });

      it('handles namespace prefixes (e.g. x:si, x:t)', () => {
        expect(
          parseSharedStringsXml(
            `<x:sst xmlns:x="${NS}"><x:si><x:t>PREFIXED</x:t></x:si></x:sst>`,
          ),
        ).toEqual(['PREFIXED']);
      });
    });

    describe('rich text', () => {
      it('concatenates the <r><t> runs', () => {
        expect(
          parseSharedStringsXml(
            sst(
              '<si>' +
                '<r><rPr><b/><sz val="11"/></rPr><t xml:space="preserve">CABO </t></r>' +
                '<r><t>AÉREO</t></r>' +
                '</si>',
            ),
          ),
        ).toEqual(['CABO AÉREO']);
      });

      it('ignores whitespace between elements (outside <t>)', () => {
        expect(
          parseSharedStringsXml(
            sst('<si>\n  <r>\n    <t>A</t>\n  </r>\n  <r><t>B</t></r>\n</si>'),
          ),
        ).toEqual(['AB']);
      });

      it('ignores text in unknown elements', () => {
        expect(
          parseSharedStringsXml(sst('<si><t>A</t><foo>ignored</foo></si>')),
        ).toEqual(['A']);
      });
    });

    describe('phonetic text', () => {
      it('ignores <rPh> runs', () => {
        expect(
          parseSharedStringsXml(
            sst(
              '<si><t>漢字</t>' +
                '<rPh sb="0" eb="2"><t>かんじ</t></rPh>' +
                '<phoneticPr fontId="1"/></si>',
            ),
          ),
        ).toEqual(['漢字']);
      });

      it('resumes reading text after a <rPh> block', () => {
        expect(
          parseSharedStringsXml(
            sst(
              '<si><r><t>A</t></r>' +
                '<rPh sb="0" eb="1"><t>ignored</t></rPh>' +
                '<r><t>B</t></r></si>',
            ),
          ),
        ).toEqual(['AB']);
      });
    });

    describe('unusual structures', () => {
      it('ignores <t> elements outside <si>', () => {
        expect(
          parseSharedStringsXml(
            `<sst xmlns="${NS}"><t>orphan</t>${si('A')}</sst>`,
          ),
        ).toEqual(['A']);
      });

      it('pushes an empty string when an outer <si> closes after a nested one', () => {
        expect(
          parseSharedStringsXml(
            `<sst xmlns="${NS}"><si><si><t>A</t></si></si></sst>`,
          ),
        ).toEqual(['A', '']);
      });
    });

    describe('invalid XML', () => {
      it.each([
        ['mismatched closing tag', `<sst xmlns="${NS}"><si></sst>`],
        ['unclosed tag', `<sst xmlns="${NS}"><si><t>A</t>`],
        ['text outside the root element', 'not xml'],
        ['empty document', ''],
      ])('throws a descriptive error for %s', (_, xml) => {
        expect(() => parseSharedStringsXml(xml)).toThrow(INVALID_XML);
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('loadSharedStrings', () => {
    let dir: string;
    let counter = 0;

    /** Writes a zip with the entries in the given order and returns its path. */
    const xlsx = async (
      entries: Record<string, string>,
      folders: string[] = [],
    ): Promise<string> => {
      const zip = new JSZip();
      for (const folder of folders) zip.folder(folder);
      for (const [name, content] of Object.entries(entries)) {
        zip.file(name, content);
      }
      const path = join(dir, `book-${++counter}.xlsx`);
      await writeFile(path, await zip.generateAsync({ type: 'nodebuffer' }));
      return path;
    };

    beforeAll(async () => {
      dir = await mkdtemp(join(tmpdir(), 'shared-strings-'));
    });

    afterAll(async () => {
      await rm(dir, { recursive: true, force: true });
    });

    it('reads the table from xl/sharedStrings.xml', async () => {
      const path = await xlsx({
        'xl/sharedStrings.xml': sst(si('CABO'), si('POSTE')),
        'xl/worksheets/sheet1.xml': SHEET_XML,
      });

      await expect(loadSharedStrings(path)).resolves.toEqual(['CABO', 'POSTE']);
    });

    it('finds the table even when the sheet comes first in the zip (SAP export)', async () => {
      const path = await xlsx({
        'xl/worksheets/sheet1.xml': SHEET_XML,
        'xl/sharedStrings.xml': sst(si('SAP')),
      });

      await expect(loadSharedStrings(path)).resolves.toEqual(['SAP']);
    });

    it.each([
      'xl/sharedstrings.xml',
      'XL/SHAREDSTRINGS.XML',
      'root/xl/sharedStrings.xml',
    ])('accepts the path variation %s', async (name) => {
      const path = await xlsx({ [name]: sst(si('A')) });

      await expect(loadSharedStrings(path)).resolves.toEqual(['A']);
    });

    it.each([
      'sharedStrings.xml',
      'myxl/sharedStrings.xml',
      'xl/sharedStrings.xml.bak',
      'xl/sharedStrings2.xml',
      'xl/worksheets/sharedStrings.xml.rels',
    ])('ignores the non-matching entry %s', async (name) => {
      const path = await xlsx({ [name]: sst(si('A')) });

      await expect(loadSharedStrings(path)).resolves.toEqual([]);
    });

    it('returns [] when the workbook has no shared strings table', async () => {
      const path = await xlsx({ 'xl/worksheets/sheet1.xml': SHEET_XML });

      await expect(loadSharedStrings(path)).resolves.toEqual([]);
    });

    it('ignores directory entries', async () => {
      const path = await xlsx(
        { 'xl/sharedStrings.xml': sst(si('A')) },
        ['xl', 'xl/sharedStrings.xml'], // the folder becomes "xl/sharedStrings.xml/"
      );

      await expect(loadSharedStrings(path)).resolves.toEqual(['A']);
    });

    it('rejects with a descriptive error when the XML is invalid', async () => {
      const path = await xlsx({ 'xl/sharedStrings.xml': '<sst><si></sst>' });

      await expect(loadSharedStrings(path)).rejects.toThrow(INVALID_XML);
    });

    it('rejects when the file is not a zip', async () => {
      const path = join(dir, 'not-a-zip.xlsx');
      await writeFile(path, 'plain text');

      await expect(loadSharedStrings(path)).rejects.toThrow();
    });

    it('rejects with ENOENT when the file does not exist', async () => {
      await expect(
        loadSharedStrings(join(dir, 'missing.xlsx')),
      ).rejects.toMatchObject({ code: 'ENOENT' });
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('resolveSharedStrings', () => {
    const SHARED = ['CABO', '', 'POSTE'];

    it('replaces references with the text from the table', () => {
      expect(
        resolveSharedStrings(
          [{ sharedString: 0 }, { sharedString: 2 }],
          SHARED,
        ),
      ).toEqual(['CABO', 'POSTE']);
    });

    it('keeps empty strings from the table (does not turn them into null)', () => {
      expect(resolveSharedStrings([{ sharedString: 1 }], SHARED)).toEqual(['']);
    });

    it.each([
      ['out of range', 99],
      ['negative', -1],
      ['fractional', 1.5],
      ['NaN', Number.NaN],
    ])('maps an %s index to null', (_, index) => {
      expect(resolveSharedStrings([{ sharedString: index }], SHARED)).toEqual([
        null,
      ]);
    });

    it('maps every reference to null when the table is empty', () => {
      expect(resolveSharedStrings([{ sharedString: 0 }], [])).toEqual([null]);
    });

    it('leaves values that are not references unchanged', () => {
      const date = new Date(2024, 0, 15);
      const formula = { formula: 'A1', result: 1 };
      const values = [
        'text',
        42,
        date,
        true,
        null,
        undefined,
        formula,
        { sharedString: '0' },
      ];

      const result = resolveSharedStrings(values, SHARED);

      expect(result).toEqual(values);
      expect(result[2]).toBe(date);
      expect(result[6]).toBe(formula);
    });

    it('preserves the holes of exceljs sparse arrays', () => {
      const values: unknown[] = [];
      values[2] = { sharedString: 0 };
      values[4] = 10;

      const result = resolveSharedStrings(values, SHARED);

      expect(result).toHaveLength(5);
      expect(0 in result).toBe(false);
      expect(3 in result).toBe(false);
      expect(result[2]).toBe('CABO');
      expect(result[4]).toBe(10);
    });

    it('returns a new array without mutating the input', () => {
      const values = [{ sharedString: 0 }, 'x'];

      const result = resolveSharedStrings(values, SHARED);

      expect(result).not.toBe(values);
      expect(values).toEqual([{ sharedString: 0 }, 'x']);
    });

    it('returns [] for an empty row', () => {
      expect(resolveSharedStrings([], SHARED)).toEqual([]);
    });
  });
});
