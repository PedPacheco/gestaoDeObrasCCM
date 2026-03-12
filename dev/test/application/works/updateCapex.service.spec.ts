import { UpdateCapexService } from 'src/application/usecases/works/updateCapex.service';
import {
  AUXILIARY_BASE_REPOSITORY,
  IAuxiliaryBaseRepository,
} from 'src/domain/repositories/IAuxiliaryBaseRepository';
import {
  IUpdateCapexRepository,
  UPDATE_CAPEX_REPOSITORY,
} from 'src/domain/repositories/works/IUpdateCapexRepository';

import { Test, TestingModule } from '@nestjs/testing';

import { mockReturnAuxiliaryBaseCN52N } from '../../../test/mocks/mocksMaterialCapex';

describe('UpdateCapexService', () => {
  let service: UpdateCapexService;
  let auxiliaryRepo: jest.Mocked<IAuxiliaryBaseRepository>;
  let updateRepo: jest.Mocked<IUpdateCapexRepository>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCapexService,
        {
          provide: AUXILIARY_BASE_REPOSITORY,
          useValue: {
            getFator: jest.fn(),
            getAuxiliaryBaseCN52N: jest.fn(),
          },
        },
        {
          provide: UPDATE_CAPEX_REPOSITORY,
          useValue: {
            update: jest.fn(),
            getDeletedMaterials: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(UpdateCapexService);
    auxiliaryRepo = module.get(AUXILIARY_BASE_REPOSITORY);
    updateRepo = module.get(UPDATE_CAPEX_REPOSITORY);
  });

  afterEach(() => jest.clearAllMocks());

  describe('update', () => {
    it('should calculate and update capex values correctly', async () => {
      auxiliaryRepo.getAuxiliaryBaseCN52N.mockResolvedValue(
        mockReturnAuxiliaryBaseCN52N,
      );

      const fatorMap = new Map<string, number>();
      fatorMap.set('10057267|X/005017', 1);
      fatorMap.set('10054768|X/004078', 1);

      auxiliaryRepo.getFator.mockResolvedValue(fatorMap);

      updateRepo.getDeletedMaterials.mockResolvedValue([
        { material: '10054768' },
      ]);

      await service.update();

      const updateCall = updateRepo.update.mock.calls[0][0];

      // Deve agrupar por id_obra (1 e 2)
      expect(updateCall).toHaveLength(2);

      const obra1 = updateCall.find((item) => item.id === 1);

      expect(obra1).toBeDefined();
      expect(obra1.id).toBe(1);
      expect(obra1.qtde_calc).toBe(11);
      expect(obra1.qtde_pend).toBe(0);
      expect(obra1.mo_calc).toBeCloseTo(12.98, 2);
      expect(obra1.capex_mat_plan).toBeCloseTo(2644.57, 2);
      expect(obra1.capex_mo_plan).toBeCloseTo(6.49, 2);
      expect(obra1.capex_mo_pend).toBeCloseTo(1.298, 3);
      expect(obra1.capex_mat_pend).toBe(0);

      const obra2 = updateCall.find((item) => item.id === 2);

      expect(obra2).toBeDefined();
      expect(obra2.id).toBe(2);
      expect(obra2.qtde_calc).toBe(4);
      expect(obra2.qtde_pend).toBe(2);
      expect(obra2.mo_calc).toBe(0);
      expect(obra2.capex_mat_plan).toBeCloseTo(10578.28, 2);
      expect(obra2.capex_mo_plan).toBe(0);
      expect(obra2.capex_mo_pend).toBe(0);
      expect(obra2.capex_mat_pend).toBe(5289.14);
    });

    it('should handle materials not in deleted list', async () => {
      auxiliaryRepo.getAuxiliaryBaseCN52N.mockResolvedValue(
        mockReturnAuxiliaryBaseCN52N,
      );

      const fatorMap = new Map<string, number>();
      fatorMap.set('10057267|X/005017', 1);
      fatorMap.set('10054768|X/004078', 1);

      auxiliaryRepo.getFator.mockResolvedValue(fatorMap);

      updateRepo.getDeletedMaterials.mockResolvedValue([]);

      await service.update();

      const updateCall = updateRepo.update.mock.calls[0][0];
      const obra1 = updateCall.find((item) => item.id === 1);

      expect(obra1.mo_calc).toBe(0);
      expect(obra1.capex_mo_plan).toBe(0);
      expect(obra1.capex_mo_pend).toBe(0);
    });

    it('should not calculate qtde_pend and capex_mo_pend without reserva', async () => {
      const mockWithoutReserva = mockReturnAuxiliaryBaseCN52N.map((item) => ({
        ...item,
        reserva: null,
      }));

      auxiliaryRepo.getAuxiliaryBaseCN52N.mockResolvedValue(mockWithoutReserva);

      const fatorMap = new Map<string, number>();
      fatorMap.set('10057267|X/005017', 1);
      fatorMap.set('10054768|X/004078', 1);

      auxiliaryRepo.getFator.mockResolvedValue(fatorMap);
      updateRepo.getDeletedMaterials.mockResolvedValue([
        { material: '10054768' },
      ]);

      await service.update();

      const updateCall = updateRepo.update.mock.calls[0][0];

      updateCall.forEach((obra) => {
        expect(obra.qtde_pend).toBe(0);
        expect(obra.capex_mo_pend).toBe(0);
      });
    });

    it('should only calculate CAPEX for diagrams starting with 170, 180, 200', async () => {
      auxiliaryRepo.getAuxiliaryBaseCN52N.mockResolvedValue(
        mockReturnAuxiliaryBaseCN52N,
      );

      const fatorMap = new Map<string, number>();
      fatorMap.set('10057267|X/005017', 1);
      fatorMap.set('10054768|X/004078', 1);

      auxiliaryRepo.getFator.mockResolvedValue(fatorMap);
      updateRepo.getDeletedMaterials.mockResolvedValue([
        { material: '10054768' },
      ]);

      await service.update();

      const updateCall = updateRepo.update.mock.calls[0][0];
      const obra1 = updateCall.find((item) => item.id === 1);

      expect(obra1.mo_calc).toBeCloseTo(12.98, 2);
      expect(obra1.capex_mo_plan).toBeCloseTo(6.49, 2);
      expect(obra1.capex_mo_plan).toBeLessThan(obra1.mo_calc);
    });

    it('should use qtd_retirada for capex_mat_pend calculation', async () => {
      const mockWithRetirada = mockReturnAuxiliaryBaseCN52N.map((item) => {
        if (item.cti === 'L' && item.id_obra === 1) {
          return { ...item, qtd_retirada: 0.5 };
        }
        return item;
      });

      auxiliaryRepo.getAuxiliaryBaseCN52N.mockResolvedValue(mockWithRetirada);

      const fatorMap = new Map<string, number>();
      fatorMap.set('10057267|X/005017', 1);
      fatorMap.set('10054768|X/004078', 1);

      auxiliaryRepo.getFator.mockResolvedValue(fatorMap);
      updateRepo.getDeletedMaterials.mockResolvedValue([
        { material: '10054768' },
      ]);

      await service.update();

      const updateCall = updateRepo.update.mock.calls[0][0];
      const obra1 = updateCall.find((item) => item.id === 1);

      expect(obra1.capex_mat_pend).toBeCloseTo(0, 2);
    });

    it('should skip materials without id_obra', async () => {
      const mockWithNullObra = [
        ...mockReturnAuxiliaryBaseCN52N,
        {
          ...mockReturnAuxiliaryBaseCN52N[0],
          id_obra: null,
        },
      ];

      auxiliaryRepo.getAuxiliaryBaseCN52N.mockResolvedValue(mockWithNullObra);

      const fatorMap = new Map<string, number>();
      fatorMap.set('10057267|X/005017', 1);
      fatorMap.set('10054768|X/004078', 1);

      auxiliaryRepo.getFator.mockResolvedValue(fatorMap);
      updateRepo.getDeletedMaterials.mockResolvedValue([
        { material: '10054768' },
      ]);

      await service.update();

      const updateCall = updateRepo.update.mock.calls[0][0];

      expect(updateCall).toHaveLength(2);
      expect(updateCall.every((item) => item.id !== null)).toBe(true);
    });

    it('should handle empty fatorMap without breaking calculations', async () => {
      auxiliaryRepo.getAuxiliaryBaseCN52N.mockResolvedValue(
        mockReturnAuxiliaryBaseCN52N,
      );
      auxiliaryRepo.getFator.mockResolvedValue(new Map());
      updateRepo.getDeletedMaterials.mockResolvedValue([]);

      await service.update();

      const updateCall = updateRepo.update.mock.calls[0][0];

      updateCall.forEach((obra) => {
        expect(obra.qtde_calc).toBe(0);
        expect(obra.qtde_pend).toBe(0);
      });
    });

    it('should handle deleted materials with whitespace correctly', async () => {
      const mockWithSpaces = mockReturnAuxiliaryBaseCN52N.map((item) => ({
        ...item,
        material: `  ${item.material}  `,
      }));

      auxiliaryRepo.getAuxiliaryBaseCN52N.mockResolvedValue(mockWithSpaces);

      const fatorMap = new Map<string, number>();
      fatorMap.set('  10057267  |X/005017', 1);
      fatorMap.set('  10054768  |X/004078', 1);

      auxiliaryRepo.getFator.mockResolvedValue(fatorMap);

      updateRepo.getDeletedMaterials.mockResolvedValue([
        { material: '10054768' },
      ]);

      await service.update();

      const updateCall = updateRepo.update.mock.calls[0][0];
      const obra1 = updateCall.find((item) => item.id === 1);

      expect(obra1.mo_calc).toBeCloseTo(12.98, 2);
    });

    it('should throw error when update fails', async () => {
      auxiliaryRepo.getAuxiliaryBaseCN52N.mockResolvedValue(
        mockReturnAuxiliaryBaseCN52N,
      );
      auxiliaryRepo.getFator.mockResolvedValue(new Map());
      updateRepo.getDeletedMaterials.mockResolvedValue([]);

      updateRepo.update.mockRejectedValue(new Error('Database error'));

      await expect(service.update()).rejects.toThrow('Database error');
    });

    it('should throw error when getAuxiliaryBaseCN52N fails', async () => {
      auxiliaryRepo.getAuxiliaryBaseCN52N.mockRejectedValue(
        new Error('Failed to fetch data'),
      );

      await expect(service.update()).rejects.toThrow('Failed to fetch data');
    });

    it('should throw an error if something fails during calculation', () => {
      const materialData = null as any; // isso força erro no for...of
      const fatorMap = new Map();
      const deletedMaterials = [];

      expect(() =>
        (service as any).calculateCapexValues(
          materialData,
          fatorMap,
          deletedMaterials,
        ),
      ).toThrow();
    });
  });

  describe('extractAllMaterials', () => {
    it('should extract all materials correctly', () => {
      const materials = service['extractAllMaterials'](
        mockReturnAuxiliaryBaseCN52N,
      );

      expect(materials).toHaveLength(mockReturnAuxiliaryBaseCN52N.length);
      expect(materials[0]).toHaveProperty('material');
      expect(materials[0]).toHaveProperty('pep_ref');
      expect(materials[0].material).toBe('10057267');
      expect(materials[0].pep_ref).toBe('X/005017');
    });
  });

  describe('canIncludeCapex', () => {
    it('should identify CAPEX diagrams correctly', () => {
      const isCapex170 = service['canIncludeCapex']('170000010000');
      const isCapex180 = service['canIncludeCapex']('180000010000');
      const isCapex200 = service['canIncludeCapex']('200000010000', '23535-2');
      const isNotCapex = service['canIncludeCapex']('150000010000');
      const diagramNotSent = service['canIncludeCapex'](null);

      expect(isCapex170).toBe(true);
      expect(isCapex180).toBe(true);
      expect(isCapex200).toBe(true);
      expect(isNotCapex).toBe(false);
      expect(diagramNotSent).toBe(false);
    });
  });
});
