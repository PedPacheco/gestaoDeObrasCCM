import { beforeEach, describe, expect, it } from 'vitest';

import type {
  CalculatedValue,
  GetAuxiliaryBaseMaterialsInterface,
} from 'src/domain/entities/capex.entity';
import { CapexCalculatorService } from 'src/domain/services/capexCalculator.service';

// ─── Helpers ────────────────────────────────────────────────────────
type Row = GetAuxiliaryBaseMaterialsInterface;

/**
 * Default row: obra 1, material MAT1 / P1, eligible diagram (170…),
 * no reserva and a neutral CTI (neither 'N' nor 'L').
 */
const row = (overrides: Record<string, unknown> = {}): Row =>
  ({
    id_obra: 1,
    material: 'MAT1',
    def_proj: 'P1',
    diagrama_rede: '170001',
    elemento_pep: 'PEP-2',
    cti: 'X',
    reserva: null,
    preco: 2,
    qtd_necessaria: 10,
    qtd_retirada: 4,
    qtd_recebida: 6,
    qtd_falta: 3,
    ...overrides,
  }) as unknown as Row;

const zeros = (id: number): CalculatedValue => ({
  id,
  qtde_calc: 0,
  qtde_pend: 0,
  mo_calc: 0,
  mo_exec: 0,
  mo_pend: 0,
  capex_mat_plan: 0,
  capex_mo_plan: 0,
  capex_mo_pend: 0,
  capex_mat_pend: 0,
});

const FATOR = new Map([['MAT1|P1', 2]]);
const CONTRACT = [{ material: 'MAT1' }];

// ─── Suite ──────────────────────────────────────────────────────────
describe('CapexCalculatorService', () => {
  let service: CapexCalculatorService;

  /** Calculates a single row and returns the result of its obra. */
  const calcOne = (
    overrides: Record<string, unknown> = {},
    fatorMap: Map<string, number> = new Map(),
    contract: { material: string | null }[] = [],
  ) => {
    const result = service.calculate([row(overrides)], fatorMap, contract);
    expect(result).toHaveLength(1);
    return result[0];
  };

  beforeEach(() => {
    service = new CapexCalculatorService();
  });

  // ───────────────────────────────────────────────────────────────────
  describe('calculate – grouping', () => {
    it('returns [] when there are no rows', () => {
      expect(service.calculate([], FATOR, CONTRACT)).toEqual([]);
    });

    it.each([
      ['null', null],
      ['undefined', undefined],
      ['0 (falsy, current behaviour)', 0],
    ])('skips rows whose id_obra is %s', (_, id_obra) => {
      expect(service.calculate([row({ id_obra })], FATOR, CONTRACT)).toEqual(
        [],
      );
    });

    it('creates a zeroed entry for an obra even when no rule applies', () => {
      expect(calcOne({ id_obra: 7 })).toEqual(zeros(7));
    });

    it('accumulates every row of the same obra in a single entry', () => {
      const result = service.calculate(
        [row(), row({ qtd_necessaria: 4 })],
        FATOR,
        [],
      );

      expect(result).toHaveLength(1);
      expect(result[0].qtde_calc).toBe(5 + 2);
    });

    it('returns one entry per obra, in order of first appearance', () => {
      const result = service.calculate(
        [row({ id_obra: 3 }), row({ id_obra: 1 }), row({ id_obra: 3 })],
        FATOR,
        [],
      );

      expect(result.map((r) => r.id)).toEqual([3, 1]);
      expect(result[0].qtde_calc).toBe(10);
      expect(result[1].qtde_calc).toBe(5);
    });

    it('does not mutate the inputs', () => {
      const rows = [row({ reserva: 'R1', cti: 'L' })];
      const snapshot = structuredClone(rows);

      service.calculate(rows, FATOR, CONTRACT);

      expect(rows).toEqual(snapshot);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('calculate – quantities (fator)', () => {
    it('divides qtd_necessaria by the fator of "material|def_proj"', () => {
      expect(calcOne({}, FATOR).qtde_calc).toBe(5);
    });

    it('supports fractional results', () => {
      expect(calcOne({}, new Map([['MAT1|P1', 3]])).qtde_calc).toBeCloseTo(
        10 / 3,
      );
    });

    it.each([
      ['missing', new Map<string, number>()],
      ['for another def_proj', new Map([['MAT1|P2', 2]])],
      ['zero', new Map([['MAT1|P1', 0]])],
      ['negative', new Map([['MAT1|P1', -2]])],
    ])('ignores the quantities when the fator is %s', (_, fatorMap) => {
      const result = calcOne({ reserva: 'R1' }, fatorMap);

      expect(result.qtde_calc).toBe(0);
      expect(result.qtde_pend).toBe(0);
    });

    it('computes the pending quantity only when there is a reserva', () => {
      expect(calcOne({ reserva: 'R1' }, FATOR).qtde_pend).toBe((10 - 4) / 2);
    });

    it.each([
      ['null', null],
      ['empty', ''],
      ['blank', '   '],
    ])('has no pending quantity when the reserva is %s', (_, reserva) => {
      expect(calcOne({ reserva }, FATOR).qtde_pend).toBe(0);
    });

    it('allows a negative pending quantity (current behaviour)', () => {
      expect(
        calcOne({ reserva: 'R1', qtd_retirada: 12 }, FATOR).qtde_pend,
      ).toBe(-1);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('calculate – labour (contract materials with CTI "N")', () => {
    it('computes mo_calc, mo_exec and mo_pend', () => {
      expect(calcOne({ cti: 'N' }, new Map(), CONTRACT)).toMatchObject({
        mo_calc: 2 * 10,
        mo_exec: 2 * 6,
        mo_pend: 2 * 3,
      });
    });

    it('does not depend on the fator', () => {
      const result = calcOne({ cti: 'N' }, new Map(), CONTRACT);

      expect(result.qtde_calc).toBe(0);
      expect(result.mo_calc).toBe(20);
    });

    it('trims both the contract material and the row material', () => {
      expect(
        calcOne({ cti: 'N', material: ' MAT1 ' }, new Map(), [
          { material: '  MAT1\t' },
        ]).mo_calc,
      ).toBe(20);
    });

    it('ignores null and blank contract materials', () => {
      const result = calcOne({ cti: 'N', material: '' }, new Map(), [
        { material: null },
        { material: '   ' },
        { material: '' },
      ]);

      expect(result.mo_calc).toBe(0);
    });

    it('does not fail when the row material is null', () => {
      expect(
        calcOne({ cti: 'N', material: null }, new Map(), CONTRACT),
      ).toEqual(zeros(1));
    });

    it('ignores materials that are not in the contract list', () => {
      expect(
        calcOne({ cti: 'N' }, new Map(), [{ material: 'OTHER' }]).mo_calc,
      ).toBe(0);
    });

    it.each(['L', 'X', 'n', null])(
      'ignores contract materials with CTI %j',
      (cti) => {
        const result = calcOne({ cti }, new Map(), CONTRACT);

        expect(result.mo_calc).toBe(0);
        expect(result.capex_mo_plan).toBe(0);
      },
    );

    it('allows a negative mo_pend (no clamp, current behaviour)', () => {
      expect(
        calcOne({ cti: 'N', qtd_falta: -5 }, new Map(), CONTRACT).mo_pend,
      ).toBe(-10);
    });

    it('computes labour even when the diagram is not eligible for CAPEX', () => {
      const result = calcOne(
        { cti: 'N', diagrama_rede: '190001' },
        new Map(),
        CONTRACT,
      );

      expect(result.mo_calc).toBe(20);
      expect(result.capex_mo_plan).toBe(0);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('calculate – CAPEX labour', () => {
    it('adds the planned labour CAPEX for eligible diagrams', () => {
      expect(calcOne({ cti: 'N' }, new Map(), CONTRACT).capex_mo_plan).toBe(20);
    });

    it('adds the pending labour CAPEX only when there is a reserva', () => {
      expect(calcOne({ cti: 'N' }, new Map(), CONTRACT).capex_mo_pend).toBe(0);
      expect(
        calcOne({ cti: 'N', reserva: 'R1' }, new Map(), CONTRACT).capex_mo_pend,
      ).toBe(2 * 3);
    });

    it('clamps a negative pending labour CAPEX to 0', () => {
      expect(
        calcOne({ cti: 'N', reserva: 'R1', qtd_falta: -5 }, new Map(), CONTRACT)
          .capex_mo_pend,
      ).toBe(0);
    });

    it('ignores non-contract materials with CTI "N"', () => {
      const result = calcOne({ cti: 'N', reserva: 'R1' }, new Map(), []);

      expect(result.capex_mo_plan).toBe(0);
      expect(result.capex_mo_pend).toBe(0);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('calculate – CAPEX material (CTI "L")', () => {
    it('adds the planned material CAPEX without needing fator or contract', () => {
      expect(calcOne({ cti: 'L' }).capex_mat_plan).toBe(10 * 2);
    });

    it('adds the pending material CAPEX only when there is a reserva', () => {
      expect(calcOne({ cti: 'L' }).capex_mat_pend).toBe(0);
      expect(calcOne({ cti: 'L', reserva: 'R1' }).capex_mat_pend).toBe(
        2 * (10 - 4),
      );
    });

    it('clamps a negative pending material CAPEX to 0', () => {
      expect(
        calcOne({ cti: 'L', reserva: 'R1', qtd_retirada: 12 }).capex_mat_pend,
      ).toBe(0);
    });

    it('ignores rows whose diagram is not eligible', () => {
      const result = calcOne({
        cti: 'L',
        reserva: 'R1',
        diagrama_rede: '200001',
        elemento_pep: 'PEP-1',
      });

      expect(result.capex_mat_plan).toBe(0);
      expect(result.capex_mat_pend).toBe(0);
    });

    it('is case-sensitive on the CTI (current behaviour)', () => {
      expect(calcOne({ cti: 'l' }).capex_mat_plan).toBe(0);
    });

    it('does not count material rows as labour, even if in the contract list', () => {
      const result = calcOne({ cti: 'L' }, new Map(), CONTRACT);

      expect(result.mo_calc).toBe(0);
      expect(result.capex_mat_plan).toBe(20);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('calculate – full scenario', () => {
    it('combines every rule across several obras', () => {
      const result = service.calculate(
        [
          // obra 1: material with fator and reserva (L, eligible)
          row({ cti: 'L', reserva: 'R1' }),
          // obra 1: labour from the contract list (N, eligible, reserva)
          row({ material: 'SRV1', cti: 'N', reserva: 'R2', preco: 5 }),
          // obra 2: diagram 200 with a valid PEP
          row({
            id_obra: 2,
            cti: 'L',
            diagrama_rede: '200555',
            elemento_pep: 'ABC-2X',
          }),
          // ignored: no obra
          row({ id_obra: null, cti: 'L' }),
        ],
        FATOR,
        [{ material: 'SRV1' }],
      );

      expect(result).toEqual([
        {
          ...zeros(1),
          qtde_calc: 5,
          qtde_pend: 3,
          mo_calc: 50,
          mo_exec: 30,
          mo_pend: 15,
          capex_mo_plan: 50,
          capex_mo_pend: 15,
          capex_mat_plan: 20,
          capex_mat_pend: 12,
        },
        { ...zeros(2), qtde_calc: 5, capex_mat_plan: 20 },
      ]);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('canIncludeCapex', () => {
    it.each([
      ['170123', undefined, true],
      ['180123', undefined, true],
      ['170', undefined, true],
      ['180999', 'ANY', true],
      ['190123', 'PEP-2', false],
      ['017000', undefined, false],
      ['20', undefined, false],
      ['200123', undefined, false],
      ['200123', '', false],
      ['200123', 'PEP-1', false],
      ['200123', 'PEP-2', true],
      ['200123', 'PEP-20', true], // includes('-2') also matches -20 (current behaviour)
    ])('diagram %j with PEP %j → %s', (diagrama, pep, expected) => {
      expect(service.canIncludeCapex(diagrama, pep)).toBe(expected);
    });

    it.each([
      ['empty', ''],
      ['null', null],
      ['undefined', undefined],
    ])('returns false for an %s diagram', (_, diagrama) => {
      expect(service.canIncludeCapex(diagrama as never, 'PEP-2')).toBe(false);
    });
  });
});
