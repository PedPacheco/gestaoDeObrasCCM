import { ConflictException } from '@nestjs/common';
import { Prisma } from 'src/infra/generated/prisma/client';
import { resolvePointByPointMode } from 'src/infra/repositories/works/management/pointByPointMode.helper';
import { PONTO_A_PONTO_PARTNER_ID } from 'src/utils/pointByPoint/serviceType.utils';

// ─── Constantes e helpers ────────────────────────────────────────────

const WORK_ID = 10;

const POINT_BY_POINT_PARTNERS: number[] = [...PONTO_A_PONTO_PARTNER_ID];
/** Primeiro ID da lista ponto a ponto */
const POINT_BY_POINT_PARTNER = POINT_BY_POINT_PARTNERS[0];
/** Maior ID da lista + 1 → garantidamente fora da lista (tradicional) */
const TRADITIONAL_PARTNER = Math.max(0, ...POINT_BY_POINT_PARTNERS) + 1;

const CONFLICT_MESSAGE =
  'Não é possível trocar para uma parceira de outro modelo de programação (ponto a ponto / tradicional) em uma obra que já possui programações.';

const buildClient = () => ({
  obras: { findUnique: vi.fn() },
  programacoes: { count: vi.fn() },
});

type ClientMock = ReturnType<typeof buildClient>;

const asClient = (client: ClientMock) =>
  client as unknown as Pick<Prisma.TransactionClient, 'obras' | 'programacoes'>;

describe('resolvePointByPointMode', () => {
  let client: ClientMock;

  /** Define o modo atual da obra */
  const mockWork = (programacao_ponto_a_ponto: boolean | null) =>
    client.obras.findUnique.mockResolvedValue({ programacao_ponto_a_ponto });

  const run = (partnerId?: number | null) =>
    resolvePointByPointMode(asClient(client), WORK_ID, partnerId);

  beforeEach(() => {
    client = buildClient(); // client novo em cada teste → sem estado partilhado
    client.programacoes.count.mockResolvedValue(0);
  });

  // ─── Sanidade da configuração ──────────────────────────────────────

  describe('PONTO_A_PONTO_PARTNER_ID', () => {
    it('should be a non-empty list', () => {
      expect(Array.isArray(PONTO_A_PONTO_PARTNER_ID)).toBe(true);
      expect(POINT_BY_POINT_PARTNERS.length).toBeGreaterThan(0);
    });

    it('should only contain integer ids', () => {
      for (const id of POINT_BY_POINT_PARTNERS) {
        expect(Number.isInteger(id)).toBe(true);
      }
    });

    it('should not contain the id used as traditional partner', () => {
      expect(POINT_BY_POINT_PARTNERS).not.toContain(TRADITIONAL_PARTNER);
    });
  });

  // ─── Parceira não informada ────────────────────────────────────────

  describe('when the partner is not informed', () => {
    it.each([[undefined], [null]])(
      'should return undefined without querying when partnerId = %p',
      async (partnerId) => {
        await expect(run(partnerId)).resolves.toBeUndefined();
        expect(client.obras.findUnique).not.toHaveBeenCalled();
        expect(client.programacoes.count).not.toHaveBeenCalled();
      },
    );

    it('should return undefined when the argument is omitted', async () => {
      await expect(
        resolvePointByPointMode(asClient(client), WORK_ID),
      ).resolves.toBeUndefined();
      expect(client.obras.findUnique).not.toHaveBeenCalled();
    });
  });

  // ─── Leitura da obra ───────────────────────────────────────────────

  describe('work lookup', () => {
    it('should read only the current mode of the work', async () => {
      mockWork(false);

      await run(TRADITIONAL_PARTNER);

      expect(client.obras.findUnique).toHaveBeenCalledTimes(1);
      expect(client.obras.findUnique).toHaveBeenCalledWith({
        where: { id: WORK_ID },
        select: { programacao_ponto_a_ponto: true },
      });
    });

    it('should return undefined when the work does not exist', async () => {
      client.obras.findUnique.mockResolvedValueOnce(null);

      await expect(run(POINT_BY_POINT_PARTNER)).resolves.toBeUndefined();
      expect(client.programacoes.count).not.toHaveBeenCalled();
    });

    it('should propagate errors from findUnique', async () => {
      client.obras.findUnique.mockRejectedValueOnce(new Error('db down'));

      await expect(run(POINT_BY_POINT_PARTNER)).rejects.toThrow('db down');
      expect(client.programacoes.count).not.toHaveBeenCalled();
    });
  });

  // ─── Pertença à lista de IDs ───────────────────────────────────────

  describe('partner list membership', () => {
    it.each(POINT_BY_POINT_PARTNERS)(
      'should treat partner %i (in the list) as point-by-point',
      async (partnerId) => {
        mockWork(true);

        await expect(run(partnerId)).resolves.toBe(true);
        expect(client.programacoes.count).not.toHaveBeenCalled();
      },
    );

    it('should treat a partner outside the list as traditional', async () => {
      mockWork(false);

      await expect(run(TRADITIONAL_PARTNER)).resolves.toBe(false);
      expect(client.programacoes.count).not.toHaveBeenCalled();
    });

    it.each(POINT_BY_POINT_PARTNERS)(
      'should switch a traditional work to point-by-point with partner %i when there are no schedules',
      async (partnerId) => {
        mockWork(false);

        await expect(run(partnerId)).resolves.toBe(true);
        expect(client.programacoes.count).toHaveBeenCalledTimes(1);
      },
    );
  });

  // ─── Modo não muda ─────────────────────────────────────────────────

  describe('when the mode does not change', () => {
    it.each([
      ['point-by-point → point-by-point', true, POINT_BY_POINT_PARTNER, true],
      ['traditional → traditional', false, TRADITIONAL_PARTNER, false],
      [
        'null flag (traditional) → traditional',
        null,
        TRADITIONAL_PARTNER,
        false,
      ],
    ])(
      '%s: should return the mode without counting schedules',
      async (_, current, partner, expected) => {
        mockWork(current);

        await expect(run(partner)).resolves.toBe(expected);
        expect(client.programacoes.count).not.toHaveBeenCalled();
      },
    );

    it('should allow the change even if the work has schedules (no count is made)', async () => {
      mockWork(true);
      client.programacoes.count.mockResolvedValue(5);

      await expect(run(POINT_BY_POINT_PARTNER)).resolves.toBe(true);
    });
  });

  // ─── Modo muda ─────────────────────────────────────────────────────

  describe.each([
    {
      direction: 'traditional → point-by-point',
      current: false,
      partner: POINT_BY_POINT_PARTNER,
      next: true,
    },
    {
      direction: 'null flag → point-by-point',
      current: null,
      partner: POINT_BY_POINT_PARTNER,
      next: true,
    },
    {
      direction: 'point-by-point → traditional',
      current: true,
      partner: TRADITIONAL_PARTNER,
      next: false,
    },
  ])('when the mode changes ($direction)', ({ current, partner, next }) => {
    beforeEach(() => mockWork(current));

    it('should count the schedules of the work', async () => {
      await run(partner);

      expect(client.programacoes.count).toHaveBeenCalledTimes(1);
      expect(client.programacoes.count).toHaveBeenCalledWith({
        where: { id_obra: WORK_ID },
      });
    });

    it('should return the new mode when the work has no schedules', async () => {
      client.programacoes.count.mockResolvedValueOnce(0);

      await expect(run(partner)).resolves.toBe(next);
    });

    it.each([[1], [3]])(
      'should throw ConflictException when the work has %p schedule(s)',
      async (count) => {
        client.programacoes.count.mockResolvedValueOnce(count);

        const error = await run(partner).catch((e) => e);

        expect(error).toBeInstanceOf(ConflictException);
        expect(error.message).toBe(CONFLICT_MESSAGE);
      },
    );

    it('should propagate errors from count', async () => {
      client.programacoes.count.mockRejectedValueOnce(
        new Error('count failed'),
      );

      await expect(run(partner)).rejects.toThrow('count failed');
    });
  });

  // ─── Conversão do partnerId ────────────────────────────────────────

  describe('partner id conversion', () => {
    it.each(POINT_BY_POINT_PARTNERS)(
      'should accept partner %i as a numeric string',
      async (partnerId) => {
        mockWork(true);

        await expect(run(String(partnerId) as any)).resolves.toBe(true);
        expect(client.programacoes.count).not.toHaveBeenCalled();
      },
    );

    it.skipIf(POINT_BY_POINT_PARTNERS.includes(0))(
      'should treat partnerId = 0 as a traditional partner (not as missing)',
      async () => {
        mockWork(false);

        await expect(run(0)).resolves.toBe(false);
        expect(client.obras.findUnique).toHaveBeenCalled();
      },
    );

    it('should treat a non-numeric partner id as traditional (current behaviour)', async () => {
      mockWork(false);

      await expect(run('abc' as any)).resolves.toBe(false);
    });
  });

  // ─── Uso do client ─────────────────────────────────────────────────

  it('should only use the client received as parameter', async () => {
    mockWork(false);

    await run(POINT_BY_POINT_PARTNER);

    expect(client.obras.findUnique).toHaveBeenCalled();
    expect(client.programacoes.count).toHaveBeenCalled();
  });
});
