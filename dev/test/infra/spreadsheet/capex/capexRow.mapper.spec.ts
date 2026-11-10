import { describe, expect, it } from 'vitest';

import {
  CAPEX_COLUMNS,
  CAPEX_HEADER_ROWS,
  columnLetter,
  mapCapexRow,
  type CapexRowValues,
} from 'src/infra/spreadsheet/capex/capexRow.mapper';

type Key = keyof CapexRowValues;

const ROW = 7;

/** A fully valid row (every value within its column limits). */
const VALID: CapexRowValues = {
  diagrama_rede: '1000123',
  def_proj: 'P-0001',
  material: '12345678',
  texto_breve: 'CABO MULTIPLEXADO',
  centro: 'C001',
  dep: 'D001',
  cti: 'AB',
  elemento_pep: 'PEP-01',
  und: 'M',
  preco: 10.5,
  qtd_necessaria: 100,
  qtd_retirada: 40,
  qtd_recebida: 50,
  qtd_falta: 10,
  reserva: '12345',
};

const STRING_COLUMNS = CAPEX_COLUMNS.filter((c) => c.kind === 'string');
const NUMBER_COLUMNS = CAPEX_COLUMNS.filter((c) => c.kind === 'number');

// ─── Helpers ────────────────────────────────────────────────────────
const column = (key: Key) => {
  const def = CAPEX_COLUMNS.find((c) => c.key === key);
  if (!def) throw new Error(`Unknown column ${key}`);
  return def;
};

/** Builds an exceljs-like `row.values` array (1-based, sparse). */
const rowValues = (
  cells: Partial<Record<Key, unknown>>,
  extra: Record<number, unknown> = {},
): unknown[] => {
  const values: unknown[] = [];
  for (const [key, value] of Object.entries(cells)) {
    values[column(key as Key).index] = value;
  }
  for (const [index, value] of Object.entries(extra)) {
    values[Number(index)] = value;
  }
  return values;
};

/** Maps a valid row where only `key` is replaced by `value`. */
const mapWith = (key: Key, value: unknown) =>
  mapCapexRow(rowValues({ ...VALID, [key]: value }), ROW);

/** Returns the mapped value of `key`, asserting there are no errors. */
const valueOf = (key: Key, value: unknown) => {
  const result = mapWith(key, value);
  expect(result.errors).toEqual([]);
  return result.item?.[key];
};

/** Returns the error message of `key`, asserting it is the only error. */
const errorOf = (key: Key, value: unknown) => {
  const result = mapWith(key, value);
  expect(result.item).toBeNull();
  expect(result.errors).toHaveLength(1);
  return result.errors[0].message;
};

const label = (key: Key) => `${columnLetter(column(key).index)} (${key})`;

// ─── Suite ──────────────────────────────────────────────────────────
describe('capexRow.mapper', () => {
  // ───────────────────────────────────────────────────────────────────
  describe('constants', () => {
    it('skips 2 header rows', () => {
      expect(CAPEX_HEADER_ROWS).toBe(2);
    });

    it('defines one column per CapexRowValues field', () => {
      expect(CAPEX_COLUMNS.map((c) => c.key).sort()).toEqual(
        Object.keys(VALID).sort(),
      );
    });

    it('has no duplicated keys or indexes', () => {
      const keys = CAPEX_COLUMNS.map((c) => c.key);
      const indexes = CAPEX_COLUMNS.map((c) => c.index);

      expect(new Set(keys).size).toBe(keys.length);
      expect(new Set(indexes).size).toBe(indexes.length);
    });

    it('defines a maxLength for every string column', () => {
      for (const def of STRING_COLUMNS) {
        expect(def.maxLength, def.key).toBeGreaterThan(0);
      }
    });

    it('maps the expected spreadsheet columns (B–O and Q)', () => {
      expect(CAPEX_COLUMNS.map((c) => columnLetter(c.index))).toEqual([
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'J',
        'K',
        'L',
        'M',
        'N',
        'O',
        'Q',
      ]);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('columnLetter', () => {
    it.each([
      [1, 'A'],
      [2, 'B'],
      [17, 'Q'],
      [26, 'Z'],
      [27, 'AA'],
      [28, 'AB'],
      [52, 'AZ'],
      [53, 'BA'],
      [702, 'ZZ'],
      [703, 'AAA'],
      [16_384, 'XFD'], // last Excel column
    ])('converts %i to %s', (index, expected) => {
      expect(columnLetter(index)).toBe(expected);
    });

    it.each([0, -1])('returns an empty string for %i', (index) => {
      expect(columnLetter(index)).toBe('');
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('mapCapexRow', () => {
    describe('row result', () => {
      it('maps a complete valid row', () => {
        expect(mapCapexRow(rowValues(VALID), ROW)).toEqual({
          item: VALID,
          errors: [],
          empty: false,
        });
      });

      it('ignores columns that are not mapped (A, P and beyond Q)', () => {
        const values = rowValues(VALID, { 1: 'x', 16: 'y', 18: 'z' });

        expect(mapCapexRow(values, ROW).item).toEqual(VALID);
      });

      it('fills missing cells with null in a partially filled row', () => {
        const result = mapCapexRow(
          rowValues({ material: '123', preco: 5 }),
          ROW,
        );

        expect(result.empty).toBe(false);
        expect(result.errors).toEqual([]);
        expect(result.item).toEqual({
          ...Object.fromEntries(Object.keys(VALID).map((k) => [k, null])),
          material: '123',
          preco: 5,
        });
      });

      it.each([
        ['no cells', []],
        [
          'only null/undefined cells',
          rowValues({ texto_breve: null, preco: undefined }),
        ],
        ['only blank strings', rowValues({ texto_breve: '   ', preco: '  ' })],
        ['only unmapped columns', rowValues({}, { 1: 'x', 16: 'y' })],
      ])('flags the row as empty when it has %s', (_, values) => {
        expect(mapCapexRow(values, ROW)).toEqual({
          item: null,
          errors: [],
          empty: true,
        });
      });

      it.each([null, undefined])(
        'treats %s values as an empty row',
        (values) => {
          expect(mapCapexRow(values as never, ROW)).toEqual({
            item: null,
            errors: [],
            empty: true,
          });
        },
      );

      it('returns item null and the error details when a cell is invalid', () => {
        expect(mapWith('preco', 'abc')).toEqual({
          item: null,
          errors: [
            {
              row: ROW,
              column: 'K (preco)',
              message: 'valor "abc" não é numérico',
            },
          ],
          empty: false,
        });
      });

      it('collects one error per invalid column, in column order', () => {
        const result = mapCapexRow(
          rowValues({
            ...VALID,
            reserva: { error: '#REF!' },
            preco: 'abc',
            material: '123456789',
          }),
          ROW,
        );

        expect(result.item).toBeNull();
        expect(result.errors.map((e) => e.column)).toEqual([
          'D (material)',
          'K (preco)',
          'Q (reserva)',
        ]);
      });

      it('does not flag as empty a row whose only cell is invalid', () => {
        const result = mapCapexRow(rowValues({ preco: 'abc' }), ROW);

        expect(result.empty).toBe(false);
        expect(result.errors).toHaveLength(1);
      });

      it.each(CAPEX_COLUMNS.map((c) => [c.key, c.index] as const))(
        'labels errors in %s with the column letter and key',
        (key) => {
          const result = mapWith(key, { sharedString: 0 });

          expect(result.errors[0]).toMatchObject({
            row: ROW,
            column: label(key),
          });
        },
      );
    });

    // ─────────────────────────────────────────────────────────────────
    describe('cell unwrapping', () => {
      it.each([null, undefined])('maps a %s cell to null', (value) => {
        expect(valueOf('texto_breve', value)).toBeNull();
        expect(valueOf('preco', value)).toBeNull();
      });

      it('uses the result of a formula', () => {
        expect(valueOf('preco', { formula: 'A1*2', result: 42 })).toBe(42);
        expect(valueOf('texto_breve', { formula: 'A1', result: 'CABO' })).toBe(
          'CABO',
        );
      });

      it('uses the result of a shared formula', () => {
        expect(valueOf('preco', { sharedFormula: 'K3', result: 5 })).toBe(5);
      });

      it('converts a numeric formula result in a string column', () => {
        expect(valueOf('texto_breve', { formula: 'A1', result: 123 })).toBe(
          '123',
        );
      });

      it('maps a formula with an undefined result to null', () => {
        expect(
          valueOf('preco', { formula: 'A1', result: undefined }),
        ).toBeNull();
      });

      it('reports an error when the formula result is an error', () => {
        expect(
          errorOf('preco', { formula: '1/0', result: { error: '#DIV/0!' } }),
        ).toBe('célula com erro (#DIV/0!)');
      });

      it('rejects a formula without a cached result (current behaviour)', () => {
        expect(errorOf('preco', { formula: 'A1' })).toBe(
          'tipo de célula não suportado ({"formula":"A1"})',
        );
      });

      it('joins rich text parts', () => {
        expect(
          valueOf('texto_breve', {
            richText: [{ text: 'CABO ' }, { text: 'AÉREO' }],
          }),
        ).toBe('CABO AÉREO');
      });

      it('treats rich text parts without text as empty', () => {
        expect(
          valueOf('texto_breve', {
            richText: [{ text: 'A' }, { font: {} }, { text: 'B' }],
          }),
        ).toBe('AB');
      });

      it('parses rich text in a number column', () => {
        expect(valueOf('preco', { richText: [{ text: '1.234,5' }] })).toBe(
          1234.5,
        );
      });

      it('uses the text of a hyperlink', () => {
        expect(
          valueOf('texto_breve', {
            text: 'Link',
            hyperlink: 'https://edp.com',
          }),
        ).toBe('Link');
      });

      it('unwraps a hyperlink whose text is rich text', () => {
        expect(
          valueOf('texto_breve', {
            text: { richText: [{ text: 'Rich' }, { text: 'Link' }] },
            hyperlink: 'https://edp.com',
          }),
        ).toBe('RichLink');
      });

      it('rejects unresolved shared strings', () => {
        expect(errorOf('texto_breve', { sharedString: 3 })).toBe(
          'texto não resolvido (índice 3)',
        );
      });

      it('gives sharedString precedence over the other cell shapes', () => {
        expect(
          errorOf('texto_breve', { sharedString: 1, result: 'x', text: 'y' }),
        ).toBe('texto não resolvido (índice 1)');
      });

      it('rejects error cells', () => {
        expect(errorOf('preco', { error: '#N/A' })).toBe(
          'célula com erro (#N/A)',
        );
      });

      it('rejects unsupported objects', () => {
        expect(errorOf('texto_breve', { foo: 'bar' })).toBe(
          'tipo de célula não suportado ({"foo":"bar"})',
        );
      });

      it('rejects arrays as unsupported objects', () => {
        expect(errorOf('texto_breve', ['a'])).toBe(
          'tipo de célula não suportado (["a"])',
        );
      });

      it('truncates the unsupported object preview to 60 characters', () => {
        const cell = { data: 'x'.repeat(100) };

        expect(errorOf('texto_breve', cell)).toBe(
          `tipo de célula não suportado (${JSON.stringify(cell).slice(0, 60)})`,
        );
      });

      it.each([
        [
          'circular object',
          (() => {
            const c: Record<string, unknown> = {};
            c.self = c;
            return c;
          })(),
        ],
        ['object with a BigInt', { value: BigInt(1) }],
      ])('rethrows unexpected (non-cell) errors: %s', (_, cell) => {
        expect(() => mapWith('texto_breve', cell)).toThrow(TypeError);
      });
    });

    // ─────────────────────────────────────────────────────────────────
    describe('string columns', () => {
      it('trims the value', () => {
        expect(valueOf('texto_breve', '  CABO  ')).toBe('CABO');
      });

      it.each(['', '   ', '\t\n'])('maps blank string %j to null', (value) => {
        expect(valueOf('texto_breve', value)).toBeNull();
      });

      it('converts numbers to strings', () => {
        expect(valueOf('material', 12_345_678)).toBe('12345678');
      });

      it('loses leading zeros when Excel stores the code as a number (current behaviour)', () => {
        expect(valueOf('material', 123)).toBe('123'); // typed as 00000123
      });

      it('converts a BigInt to string', () => {
        expect(valueOf('material', BigInt(42))).toBe('42');
      });

      it.each([
        [true, 'valor "true" não é texto'],
        [false, 'valor "false" não é texto'],
      ])('rejects boolean %s', (value, message) => {
        expect(errorOf('texto_breve', value)).toBe(message);
      });

      it('rejects dates (with a truncated preview)', () => {
        expect(errorOf('texto_breve', new Date(2024, 0, 15))).toMatch(
          /^valor ".{20}\.\.\." não é texto$/,
        );
      });

      it.each(STRING_COLUMNS.map((c) => [c.key, c.maxLength!] as const))(
        '%s accepts exactly %i characters',
        (key, max) => {
          expect(valueOf(key, 'x'.repeat(max))).toBe('x'.repeat(max));
        },
      );

      it.each(STRING_COLUMNS.map((c) => [c.key, c.maxLength!] as const))(
        '%s rejects more than %i characters',
        (key, max) => {
          expect(errorOf(key, 'x'.repeat(max + 1))).toMatch(
            new RegExp(`excede ${max} caracteres$`),
          );
        },
      );

      it('checks the length after trimming', () => {
        expect(valueOf('material', '   12345678   ')).toBe('12345678');
      });

      it('shows short values in full in the error message', () => {
        expect(errorOf('cti', 'ABC')).toBe('valor "ABC" excede 2 caracteres');
      });

      it('truncates values longer than 20 characters in the error message', () => {
        expect(errorOf('texto_breve', 'x'.repeat(101))).toBe(
          `valor "${'x'.repeat(20)}..." excede 100 caracteres`,
        );
      });
    });

    // ─────────────────────────────────────────────────────────────────
    describe('number columns', () => {
      it.each([0, -3, 10.5, 1_000_000])('keeps the number %d', (value) => {
        expect(valueOf('preco', value)).toBe(value);
      });

      it.each([
        [Number.NaN, 'NaN'],
        [Number.POSITIVE_INFINITY, 'Infinity'],
        [Number.NEGATIVE_INFINITY, '-Infinity'],
      ])('rejects the non-finite number %s', (value, text) => {
        expect(errorOf('preco', value)).toBe(`valor "${text}" não é numérico`);
      });

      it.each([
        ['42', 42],
        ['  42  ', 42],
        ['10.5', 10.5],
        ['10,5', 10.5],
        ['-3,5', -3.5],
        ['1.234,56', 1234.56],
        ['1.234.567,89', 1_234_567.89],
        ['1.234', 1.234], // without a comma the dot is decimal (current behaviour)
        ['1e3', 1000],
        ['0x10', 16],
      ])('parses the string %j as %d', (value, expected) => {
        expect(valueOf('preco', value)).toBe(expected);
      });

      it.each(['', '   '])('maps the blank string %j to null', (value) => {
        expect(valueOf('preco', value)).toBeNull();
      });

      it.each(['abc', '12abc', '1,2,3', 'Infinity', ' abc '])(
        'rejects the invalid string %j (showing the original value)',
        (value) => {
          expect(errorOf('preco', value)).toBe(
            `valor "${value}" não é numérico`,
          );
        },
      );

      it('does not truncate a preview of exactly 20 characters', () => {
        const value = 'a'.repeat(20);

        expect(errorOf('preco', value)).toBe(`valor "${value}" não é numérico`);
      });

      it.each([
        [true, 'valor "true" não é numérico'],
        [BigInt(5), 'valor "5" não é numérico'],
      ])('rejects other primitive types (%s)', (value, message) => {
        expect(errorOf('preco', value)).toBe(message);
      });

      it('rejects dates', () => {
        expect(errorOf('preco', new Date(2024, 0, 15))).toMatch(
          /^valor ".{20}\.\.\." não é numérico$/,
        );
      });

      it.each(NUMBER_COLUMNS.map((c) => c.key))(
        '%s parses Brazilian formatted numbers',
        (key) => {
          expect(valueOf(key, '1.234,5')).toBe(1234.5);
        },
      );
    });
  });
});
