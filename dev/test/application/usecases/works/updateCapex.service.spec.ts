import { BadRequestException } from '@nestjs/common';
import { UpdateCapexService } from 'src/application/usecases/works/management/updateCapex.service';

import type {
  CalculatedValue,
  GetAuxiliaryBaseMaterialsInterface,
} from 'src/domain/entities/capex.entity';

// ─── Helpers ──────────────────────────────────────────────────────────

const makeMaterial = (
  overrides: Partial<GetAuxiliaryBaseMaterialsInterface> = {},
): GetAuxiliaryBaseMaterialsInterface =>
  ({
    id_obra: 10,
    diagrama_rede: '170000000001',
    def_proj: 'B/000215',
    material: '71000460',
    cti: 'N',
    elemento_pep: null,
    preco: 3.2,
    qtd_necessaria: 510.9,
    qtd_retirada: 0,
    qtd_recebida: 0,
    qtd_falta: 510.9,
    reserva: null,
    ...overrides,
  }) as GetAuxiliaryBaseMaterialsInterface;

const makeCalculated = (id: number): CalculatedValue => ({
  id,
  qtde_calc: 1,
  qtde_pend: 0,
  mo_calc: 2,
  mo_exec: 0,
  mo_pend: 2,
  capex_mo_plan: 2,
  capex_mat_plan: 0,
  capex_mo_pend: 0,
  capex_mat_pend: 0,
});

describe('UpdateCapexService', () => {
  let service: UpdateCapexService;

  const materials = [
    makeMaterial({ material: '71000460', def_proj: 'B/000215' }),
    makeMaterial({ material: '71000487', def_proj: 'B/000300', id_obra: 20 }),
  ];
  const fatorMap = new Map([['71000460|B/000215', 2]]);
  const contractMaterials = [{ material: '71000460' }];
  const calculated = [makeCalculated(10), makeCalculated(20)];

  const auxiliaryBaseRepository = {
    getAuxiliaryBaseCN52N: vi.fn(),
    getFator: vi.fn(),
  };

  const updateCapexRepository = {
    getDeletedMaterials: vi.fn(),
    update: vi.fn(),
  };

  const calculator = { calculate: vi.fn() };

  beforeEach(() => {
    vi.clearAllMocks();

    auxiliaryBaseRepository.getAuxiliaryBaseCN52N.mockResolvedValue(materials);
    auxiliaryBaseRepository.getFator.mockResolvedValue(fatorMap);
    updateCapexRepository.getDeletedMaterials.mockResolvedValue(
      contractMaterials,
    );
    updateCapexRepository.update.mockResolvedValue(undefined);
    calculator.calculate.mockReturnValue(calculated);

    service = new UpdateCapexService(
      auxiliaryBaseRepository as any,
      updateCapexRepository as any,
      calculator as any,
    );
  });

  // ============================================================
  // Orquestração
  // ============================================================

  describe('orquestração', () => {
    it('busca os fatores pelos pares material / def_proj', async () => {
      await service.update();

      expect(auxiliaryBaseRepository.getFator).toHaveBeenCalledWith([
        { material: '71000460', pep_ref: 'B/000215' },
        { material: '71000487', pep_ref: 'B/000300' },
      ]);
    });

    it('delega o cálculo ao CapexCalculatorService com os dados carregados', async () => {
      await service.update();

      expect(calculator.calculate).toHaveBeenCalledTimes(1);
      expect(calculator.calculate).toHaveBeenCalledWith(
        materials,
        fatorMap,
        contractMaterials,
      );
    });

    it('grava no repositório o resultado do calculator', async () => {
      const onProgress = vi.fn();

      await service.update(onProgress);

      expect(updateCapexRepository.update).toHaveBeenCalledWith(
        calculated,
        onProgress,
      );
    });

    it('executa as etapas pela ordem correta', async () => {
      await service.update();

      const order = [
        auxiliaryBaseRepository.getAuxiliaryBaseCN52N,
        auxiliaryBaseRepository.getFator,
        updateCapexRepository.getDeletedMaterials,
        calculator.calculate,
        updateCapexRepository.update,
      ].map((mock) => mock.mock.invocationCallOrder[0]);

      expect(order).toEqual([...order].sort((a, b) => a - b));
    });

    it('grava uma lista vazia quando não há materiais', async () => {
      auxiliaryBaseRepository.getAuxiliaryBaseCN52N.mockResolvedValue([]);
      calculator.calculate.mockReturnValue([]);

      await service.update();

      expect(auxiliaryBaseRepository.getFator).toHaveBeenCalledWith([]);
      expect(updateCapexRepository.update).toHaveBeenCalledWith([], undefined);
    });

    it('funciona sem callback de progresso', async () => {
      await expect(service.update()).resolves.toBeUndefined();
    });
  });

  // ============================================================
  // Progresso
  // ============================================================

  describe('progresso', () => {
    const phasesEmitted = (onProgress: ReturnType<typeof vi.fn>) =>
      onProgress.mock.calls.map(([event]) => event.phase);

    it('emite as fases pela ordem loading → calculating → done', async () => {
      const onProgress = vi.fn();

      await service.update(onProgress);

      const phases = phasesEmitted(onProgress);
      expect(phases[0]).toBe('loading');
      expect(phases.indexOf('calculating')).toBeGreaterThan(
        phases.lastIndexOf('loading'),
      );
      expect(phases.at(-1)).toBe('done');
    });

    it('mantém as percentagens de cada fase entre 0 e 100 e crescentes', async () => {
      const onProgress = vi.fn();

      await service.update(onProgress);

      const events = onProgress.mock.calls.map(([event]) => event);

      for (const phase of ['loading', 'calculating']) {
        const values = events
          .filter((event) => event.phase === phase)
          .map((event) => event.percentage as number);

        expect(values.length).toBeGreaterThan(0);
        values.forEach((value, i) => {
          expect(value).toBeGreaterThanOrEqual(0);
          expect(value).toBeLessThanOrEqual(100);
          if (i > 0) expect(value).toBeGreaterThanOrEqual(values[i - 1]);
        });
      }
    });

    it('informa o número de materiais carregados e de obras calculadas', async () => {
      const onProgress = vi.fn();

      await service.update(onProgress);

      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'loading',
          message: expect.stringContaining('2 materiais carregados'),
        }),
      );
      expect(onProgress).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'calculating',
          percentage: 100,
          message: expect.stringContaining('2 obras calculadas'),
        }),
      );
    });

    it('termina com done a 100% e o total de obras', async () => {
      const onProgress = vi.fn();

      await service.update(onProgress);

      expect(onProgress).toHaveBeenLastCalledWith({
        phase: 'done',
        processed: 2,
        percentage: 100,
        message: 'Atualização finalizada',
      });
    });
  });

  // ============================================================
  // Erros
  // ============================================================

  describe('erros', () => {
    it.each([
      [
        'getAuxiliaryBaseCN52N',
        () => auxiliaryBaseRepository.getAuxiliaryBaseCN52N,
      ],
      ['getFator', () => auxiliaryBaseRepository.getFator],
      ['getDeletedMaterials', () => updateCapexRepository.getDeletedMaterials],
      ['update', () => updateCapexRepository.update],
    ])(
      'relança o erro e emite a fase error quando %s falha',
      async (_, mock) => {
        const onProgress = vi.fn();
        const error = new Error('DB error');
        mock().mockRejectedValueOnce(error);

        await expect(service.update(onProgress)).rejects.toThrow(error);

        expect(onProgress).toHaveBeenLastCalledWith(
          expect.objectContaining({
            phase: 'error',
            processed: 0,
            percentage: 0,
          }),
        );
        expect(phasesOf(onProgress)).not.toContain('done');
      },
    );

    it('não grava nada quando o cálculo falha', async () => {
      calculator.calculate.mockImplementationOnce(() => {
        throw new Error('calc error');
      });

      await expect(service.update()).rejects.toThrow('calc error');

      expect(updateCapexRepository.update).not.toHaveBeenCalled();
    });

    it('não calcula nem grava quando o carregamento falha', async () => {
      auxiliaryBaseRepository.getAuxiliaryBaseCN52N.mockRejectedValueOnce(
        new Error('DB error'),
      );

      await expect(service.update()).rejects.toThrow();

      expect(calculator.calculate).not.toHaveBeenCalled();
      expect(updateCapexRepository.update).not.toHaveBeenCalled();
    });

    it('não expõe detalhes internos na mensagem de erro', async () => {
      const onProgress = vi.fn();
      updateCapexRepository.update.mockRejectedValueOnce(
        new Error('connection terminated: host=10.0.0.1'),
      );

      await expect(service.update(onProgress)).rejects.toThrow();

      const lastEvent = onProgress.mock.calls.at(-1)?.[0];
      expect(lastEvent.message).not.toContain('10.0.0.1');
      expect(lastEvent.message).toBe(
        'Erro inesperado durante a atualização do CAPEX.',
      );
    });

    it('mantém a mensagem de erros de validação', async () => {
      const onProgress = vi.fn();
      updateCapexRepository.update.mockRejectedValueOnce(
        new BadRequestException('Nenhuma obra para atualizar'),
      );

      await expect(service.update(onProgress)).rejects.toThrow(
        BadRequestException,
      );

      expect(onProgress).toHaveBeenLastCalledWith(
        expect.objectContaining({
          phase: 'error',
          message: expect.stringContaining('Nenhuma obra para atualizar'),
        }),
      );
    });
  });
});

function phasesOf(onProgress: ReturnType<typeof vi.fn>): string[] {
  return onProgress.mock.calls.map(([event]) => event.phase);
}
