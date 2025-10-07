import { UpdateCapexService } from 'src/application/works/updateCapex.service';
import { AUXILIARY_BASE_REPOSITORY } from 'src/domain/repositories/IAuxiliaryBaseRepository';

import { Test, TestingModule } from '@nestjs/testing';
import { mockMaterialCapex } from '../../mocks/mockWorksController';
import { UPDATE_CAPEX_REPOSITORY } from 'src/domain/repositories/works/IUpdateCapexRepository';

describe('UpdateCapexService', () => {
  let updateCapexService: UpdateCapexService;

  const mockRepository = {
    update: jest.fn(),
  };

  const mockAuxiliaryBaseRepository = {
    insertNotes: jest.fn(),
    getFator: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateCapexService,
        { provide: UPDATE_CAPEX_REPOSITORY, useValue: mockRepository },
        {
          provide: AUXILIARY_BASE_REPOSITORY,
          useValue: mockAuxiliaryBaseRepository,
        },
      ],
    }).compile();

    updateCapexService = module.get<UpdateCapexService>(UpdateCapexService);
  });

  afterEach(jest.clearAllMocks);

  it('should call method insertAuxiliaryBaseNotes and return data with calculated values', async () => {
    const fatorMap = new Map<string, number>();
    fatorMap.set('10054768|X/004078', 1);

    mockAuxiliaryBaseRepository.getFator.mockResolvedValue(fatorMap);

    await updateCapexService.update(mockMaterialCapex);

    expect(mockRepository.update).toHaveBeenCalledWith([
      {
        diagrama_rede: '170000027938',
        qtde_calc: 5,
        qtde_pend: 4,
        mo_calc: 6.49,
        capex_mat_plan: 8016.270000000001,
        capex_mo_plan: 6.49,
        capex_mo_pend: 5.192,
        capex_mat_pend: 8016.270000000001,
      },
    ]);
  });

  it('should call method insertAuxiliaryBaseNotes and return data with calculated values with not value in relavancia_calculo', async () => {
    const fatorMap = new Map<string, number>();
    fatorMap.set('10054768|X/004078', 1);

    mockAuxiliaryBaseRepository.getFator.mockResolvedValue(fatorMap);

    const mockMaterial = mockMaterialCapex.map((item) => {
      if (item.ctg_item === 'N') {
        item.relevancia_calculo = null;
      }

      if (item.ctg_item === 'L') {
        item.relevancia_calculo = '     ';
      }

      return item;
    });

    await updateCapexService.update(mockMaterial);

    expect(mockRepository.update).toHaveBeenCalledWith([
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
});
