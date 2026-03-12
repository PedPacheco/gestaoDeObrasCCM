import { plainToInstance } from 'class-transformer';
import { GoalsService } from 'src/application/usecases/goals.service';
import { GoalsController } from 'src/interface/controllers/goals.controller';
import { GoalsDTO } from 'src/interface/dtos/goalsDto';
import {
  Goals,
  GoalsIntefaceController,
} from 'src/interface/types/goalsInterface';

import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('MetasController', () => {
  let metasController: GoalsController;
  let metasService: GoalsService;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [GoalsController],
      providers: [
        {
          provide: GoalsService,
          useValue: {
            getGoals: jest.fn(),
          },
        },
      ],
    }).compile();

    metasController = module.get<GoalsController>(GoalsController);
    metasService = module.get<GoalsService>(GoalsService);
  });

  it('Should be defined', () => {
    expect(metasController).toBeDefined();
  });

  describe('getGoals', () => {
    it('Should build filters, get goals with filters and return the result with correct format', async () => {
      const goalsFilter: GoalsDTO = {
        regional: [1, 2, 3],
        tipo: [15],
        rda: false,
        btzero: false,
      };

      const metasResponse: Goals[] = [
        {
          id_tipo: 15,
          tipo_obra: 'MELHORIA OPERATIVA',
          turma: 'ENGELMIG',
          regional: 'São José dos Campos',
          anocalc: 2024,
          carteira: 0.78803,
          jan: { meta: 1.82, prog: 0, real: 0.6072 },
          fev: { meta: 1.52, prog: 0, real: 2.16165 },
          mar: { meta: 1.85, prog: 0, real: 0.4391 },
          abr: { meta: 1.85, prog: 0, real: 4.625559999999999 },
          mai: { meta: 1.85, prog: 0, real: 0.573 },
          jun: { meta: 1.85, prog: 0, real: 1.7559999999999998 },
          jul: { meta: 2.35, prog: 0, real: 1.783 },
          ago: { meta: 2.35, prog: 7.935930000000001, real: 0 },
          set: { meta: 2.35, prog: 0, real: 0 },
          out: { meta: 2.35, prog: 0, real: 0 },
          nov: { meta: 2.35, prog: 0, real: 0 },
          dez: { meta: 2.35, prog: 0, real: 0 },
        },
      ];

      const expectedResponse: GoalsIntefaceController = {
        statusCode: HttpStatus.OK,
        message: 'Metas trazidas com sucesso',
        data: metasResponse,
      };

      jest.spyOn(metasService, 'getGoals').mockResolvedValue(metasResponse);

      const result = await metasController.getGoals(goalsFilter);

      expect(metasService.getGoals).toHaveBeenCalledWith(goalsFilter);
      expect(result).toEqual(expectedResponse);
    });

    it('should correctly transform query params', async () => {
      const query = {
        regional: '1,2,3',
        parceira: '1,6',
        tipo: '15',
        ano: '2024,2025',
        empreendimento: '139',
        btzero: 'true',
        rda: 'true',
      };

      const goalsDTO = plainToInstance(GoalsDTO, query);

      await metasController.getGoals(goalsDTO);

      expect(goalsDTO.parceira).toStrictEqual([1, 6]);
      expect(goalsDTO.regional).toStrictEqual([1, 2, 3]);
      expect(goalsDTO.tipo).toStrictEqual([15]);
      expect(goalsDTO.ano).toStrictEqual([2024, 2025]);
      expect(goalsDTO.empreendimento).toStrictEqual([139]);
      expect(goalsDTO.btzero).toStrictEqual(true);
      expect(goalsDTO.rda).toStrictEqual(true);

      expect(metasService.getGoals).toHaveBeenCalledWith(goalsDTO);
    });

    it('should correctly transform btzero in false', async () => {
      const valueFalse = plainToInstance(GoalsDTO, { btzero: 'fafa' });

      await metasController.getGoals(valueFalse);

      expect(valueFalse.btzero).toBeFalsy();

      expect(metasService.getGoals).toHaveBeenCalledWith(valueFalse);
    });

    it('should correctly transform rda in false', async () => {
      const valueFalse = plainToInstance(GoalsDTO, { rda: 'fafa' });

      await metasController.getGoals(valueFalse);

      expect(valueFalse.rda).toBeFalsy();

      expect(metasService.getGoals).toHaveBeenCalledWith(valueFalse);
    });
  });
});
