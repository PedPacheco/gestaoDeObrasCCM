import { ConflictException } from '@nestjs/common';
import { Prisma } from 'src/generated/prisma/client';
import { resolvePointByPointMode } from 'src/infra/repositories/works/pointByPointMode.helper';
import { PONTO_A_PONTO_PARTNER_ID } from 'src/utils/pointByPoint/serviceType.utils';

// ─── Constantes e helpers ────────────────────────────────────────────
const WORK_ID = 10;
const POINT_BY_POINT_PARTNER = PONTO_A_PONTO_PARTNER_ID;
const TRADITIONAL_PARTNER = PONTO_A_PONTO_PARTNER_ID + 1;

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

  it('sanity: PONTO_A_PONTO_PARTNER_ID is a finite number', () => {
    expect(Number.isFinite(PONTO_A_PONTO_PARTNER_ID)).toBe(true);
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
    it('should accept the partner id as a numeric string', async () => {
      mockWork(true);

      await expect(run(String(POINT_BY_POINT_PARTNER) as any)).resolves.toBe(
        true,
      );
      expect(client.programacoes.count).not.toHaveBeenCalled();
    });

    it('should treat partnerId = 0 as a traditional partner (not as missing)', async () => {
      mockWork(false);

      await expect(run(0)).resolves.toBe(false);
      expect(client.obras.findUnique).toHaveBeenCalled();
    });

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
