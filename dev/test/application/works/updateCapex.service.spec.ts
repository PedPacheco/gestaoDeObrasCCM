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

  it('should calculate and update capex values correctly', async () => {
    auxiliaryRepo.getAuxiliaryBaseCN52N.mockResolvedValue(
      mockReturnAuxiliaryBaseCN52N,
    );
    const fatorMap = new Map<string, number>();
    fatorMap.set('10054768|X/004078', 1);

    auxiliaryRepo.getFator.mockResolvedValue(fatorMap);
    updateRepo.getDeletedMaterials.mockResolvedValue(['some-material']);

    await service.update();

    expect(updateRepo.update).toHaveBeenCalledWith([
      {
        ovnota: '23435356',
        diagrama_rede: '170000027938',
        qtde_calc: 15,
        qtde_pend: 2,
        mo_calc: 19.47,
        capex_mat_plan: 2644.57,
        capex_mo_plan: 12.98,
        capex_mo_pend: 1.298,
        capex_mat_pend: 0,
      },
      {
        ovnota: '23435356',
        diagrama_rede: '180000027938',
        qtde_calc: 0,
        qtde_pend: 0,
        mo_calc: 5289.14,
        capex_mat_plan: 5289.14,
        capex_mo_plan: 5289.14,
        capex_mo_pend: 2644.57,
        capex_mat_pend: 0,
      },
    ]);
  });

  it('should handle missing relevancia_calculo and still calculate correctly', async () => {
    auxiliaryRepo.getAuxiliaryBaseCN52N.mockResolvedValue(
      mockReturnAuxiliaryBaseCN52N.map((item) => ({
        ...item,
        reserva:
          item.cti === 'L' ? '     ' : item.cti === 'N' ? null : item.reserva,
      })),
    );
    const fatorMap = new Map<string, number>();
    fatorMap.set('10054768|X/004078', 1);
    auxiliaryRepo.getFator.mockResolvedValue(fatorMap);
    updateRepo.getDeletedMaterials.mockResolvedValue(['some-material']);

    await service.update();

    expect(updateRepo.update).toHaveBeenCalledWith([
      {
        ovnota: '23435356',
        diagrama_rede: '170000027938',
        qtde_calc: 15,
        qtde_pend: 0,
        mo_calc: 19.47,
        capex_mat_plan: 2644.57,
        capex_mo_plan: 12.98,
        capex_mo_pend: 0,
        capex_mat_pend: 0,
      },
      {
        ovnota: '23435356',
        diagrama_rede: '180000027938',
        qtde_calc: 0,
        qtde_pend: 0,
        mo_calc: 5289.14,
        capex_mat_plan: 5289.14,
        capex_mo_plan: 5289.14,
        capex_mo_pend: 0,
        capex_mat_pend: 0,
      },
    ]);
  });

  it('should handle missing material and still calculate correctly', async () => {
    auxiliaryRepo.getAuxiliaryBaseCN52N.mockResolvedValue(
      mockReturnAuxiliaryBaseCN52N.map((item) => ({
        ...item,
        material: item.cti === 'N' ? '71006738' : item.material,
      })),
    );
    const fatorMap = new Map<string, number>();
    fatorMap.set('10054768|X/004078', 1);
    auxiliaryRepo.getFator.mockResolvedValue(fatorMap);
    updateRepo.getDeletedMaterials.mockResolvedValue(['some-material']);
    await service.update();

    expect(updateRepo.update).toHaveBeenCalledWith([
      {
        ovnota: '23435356',
        diagrama_rede: '170000027938',
        qtde_calc: 0,
        qtde_pend: 0,
        mo_calc: 19.47,
        capex_mat_plan: 2644.57,
        capex_mo_plan: 12.98,
        capex_mo_pend: 1.298,
        capex_mat_pend: 0,
      },
      {
        ovnota: '23435356',
        diagrama_rede: '180000027938',
        qtde_calc: 0,
        qtde_pend: 0,
        mo_calc: 5289.14,
        capex_mat_plan: 5289.14,
        capex_mo_plan: 5289.14,
        capex_mo_pend: 2644.57,
        capex_mat_pend: 0,
      },
    ]);
  });

  it('should extract all materials correctly', () => {
    auxiliaryRepo.getAuxiliaryBaseCN52N.mockResolvedValue(
      mockReturnAuxiliaryBaseCN52N,
    );

    const materials = service['extractAllMaterials'](
      mockReturnAuxiliaryBaseCN52N,
    );

    expect(materials[0]).toHaveProperty('material');
    expect(materials[0]).toHaveProperty('pep_ref');
  });

  it('should handle empty fatorMap without breaking calculations', async () => {
    auxiliaryRepo.getAuxiliaryBaseCN52N.mockResolvedValue(
      mockReturnAuxiliaryBaseCN52N,
    );
    auxiliaryRepo.getFator.mockResolvedValue(new Map());
    updateRepo.getDeletedMaterials.mockResolvedValue([]);

    await service.update();

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
