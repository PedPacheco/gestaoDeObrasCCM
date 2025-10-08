import { Test, TestingModule } from '@nestjs/testing';
import { UpdateCapexService } from 'src/application/works/updateCapex.service';
import {
  AUXILIARY_BASE_REPOSITORY,
  IAuxiliaryBaseRepository,
} from 'src/domain/repositories/IAuxiliaryBaseRepository';
import {
  UPDATE_CAPEX_REPOSITORY,
  IUpdateCapexRepository,
} from 'src/domain/repositories/works/IUpdateCapexRepository';
import { mockMaterialCapex } from '../../mocks/mockWorksController';

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

  it('should calculate and update capex values correctly', async () => {
    const fatorMap = new Map<string, number>();
    fatorMap.set('10054768|X/004078', 1);

    auxiliaryRepo.getFator.mockResolvedValue(fatorMap);
    updateRepo.getDeletedMaterials.mockResolvedValue(['some-material']);

    await service.update(mockMaterialCapex);

    expect(updateRepo.update).toHaveBeenCalledWith([
      {
        diagrama_rede: '170000027938',
        qtde_calc: 5,
        qtde_pend: 2,
        mo_calc: 6.49,
        capex_mat_plan: 8016.270000000001,
        capex_mo_plan: 6.49,
        capex_mo_pend: 5.192,
        capex_mat_pend: 8016.270000000001,
      },
    ]);
  });

  it('should handle missing relevancia_calculo and still calculate correctly', async () => {
    const fatorMap = new Map<string, number>();
    fatorMap.set('10054768|X/004078', 1);
    auxiliaryRepo.getFator.mockResolvedValue(fatorMap);
    updateRepo.getDeletedMaterials.mockResolvedValue(['some-material']);

    const mockMaterial = mockMaterialCapex.map((item) => ({
      ...item,
      relevancia_calculo:
        item.ctg_item === 'L'
          ? '     '
          : item.ctg_item === 'N'
            ? null
            : item.relevancia_calculo,
    }));

    await service.update(mockMaterial);

    expect(updateRepo.update).toHaveBeenCalledWith([
      {
        diagrama_rede: '170000027938',
        qtde_calc: 5,
        qtde_pend: 0,
        mo_calc: 6.49,
        capex_mat_plan: 8016.270000000001,
        capex_mo_plan: 6.49,
        capex_mo_pend: 0,
        capex_mat_pend: 8016.270000000001,
      },
    ]);
  });

  it('should handle missing material and still calculate correctly', async () => {
    const fatorMap = new Map<string, number>();
    fatorMap.set('10054768|X/004078', 1);
    auxiliaryRepo.getFator.mockResolvedValue(fatorMap);
    updateRepo.getDeletedMaterials.mockResolvedValue(['some-material']);

    const mockMaterial = mockMaterialCapex.map((item) => ({
      ...item,
      material: item.ctg_item === 'N' ? '71006738' : item.material,
    }));

    await service.update(mockMaterial);

    expect(updateRepo.update).toHaveBeenCalledWith([
      {
        diagrama_rede: '170000027938',
        qtde_calc: 0,
        qtde_pend: 0,
        mo_calc: 6.49,
        capex_mat_plan: 8016.270000000001,
        capex_mo_plan: 6.49,
        capex_mo_pend: 5.192,
        capex_mat_pend: 8016.270000000001,
      },
    ]);
  });

  it('should extract all materials correctly', () => {
    const materials = service['extractAllMaterials'](mockMaterialCapex);

    expect(materials[0]).toHaveProperty('material');
    expect(materials[0]).toHaveProperty('pep_ref');
  });

  it('should handle empty fatorMap without breaking calculations', async () => {
    auxiliaryRepo.getFator.mockResolvedValue(new Map());
    updateRepo.getDeletedMaterials.mockResolvedValue([]);

    await service.update(mockMaterialCapex);

    expect(updateRepo.update).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          diagrama_rede: expect.any(String),
          qtde_calc: 0,
        }),
      ]),
    );
  });
});
