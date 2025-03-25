import { plainToInstance } from 'class-transformer';
import { GoalsService } from 'src/domain/services/goals/goals.service';
import { GoalsController } from 'src/interface/controllers/goals.controller';
import { GoalsDTO, RdaGoalsDTO } from 'src/interface/dtos/goalsDto';
import {
  Goals,
  GoalsIntefaceController,
} from 'src/interface/types/goalsInterface';

import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { RdaGoalsService } from 'src/domain/services/goals/rdaGoals.service';

describe('MetasController', () => {
  let metasController: GoalsController;
  let metasService: GoalsService;
  let metasRdaService: RdaGoalsService;

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
        { provide: RdaGoalsService, useValue: { get: jest.fn() } },
      ],
    }).compile();

    metasController = module.get<GoalsController>(GoalsController);
    metasService = module.get<GoalsService>(GoalsService);
    metasRdaService = module.get<RdaGoalsService>(RdaGoalsService);
  });

  it('Should be defined', () => {
    expect(metasController).toBeDefined();
  });

  describe('getGoals', () => {
    it('Should build filters, get goals with filters and return the result with correct format', async () => {
      const goalsFilter: GoalsDTO = {
        regional: [1, 2, 3],
        tipo: [15],
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
        btzero: 'true',
      };

      const goalsDTO = plainToInstance(GoalsDTO, query);

      await metasController.getGoals(goalsDTO);

      expect(goalsDTO.parceira).toStrictEqual([1, 6]);
      expect(goalsDTO.regional).toStrictEqual([1, 2, 3]);
      expect(goalsDTO.tipo).toStrictEqual([15]);
      expect(goalsDTO.ano).toStrictEqual([2024, 2025]);
      expect(goalsDTO.btzero).toStrictEqual(true);

      expect(metasService.getGoals).toHaveBeenCalledWith(goalsDTO);
    });

    it('should correctly transform btzero in false', async () => {
      const valueFalse = plainToInstance(GoalsDTO, { btzero: 'false' });

      await metasController.getGoals(valueFalse);

      expect(valueFalse.btzero).toStrictEqual(false);

      expect(metasService.getGoals).toHaveBeenCalledWith(valueFalse);
    });

    it('should correctly transform btzero in undefined', async () => {
      const valueFalse = plainToInstance(GoalsDTO, { btzero: 'fafa' });

      await metasController.getGoals(valueFalse);

      expect(valueFalse.btzero).toBeUndefined();

      expect(metasService.getGoals).toHaveBeenCalledWith(valueFalse);
    });
  });

  describe('getRdaGoals', () => {
    it('Should build filters, get rda goals with filters and return the result with correct format', async () => {
      const filters: RdaGoalsDTO = {
        ano: [2025],
        empreendimento: [1],
        parceira: [5],
      };

      const rdaGoalsResponse = {
        works: [
          {
            empreendimento: 'PARQUE DOURADO - RDA Parque Dourado 34,5/13,8kV',
            tipo_obra: 'RDA EXTENSÃO REDE AEREA',
            turma: 'EDP',
            regional: 'Mogi das Cruzes',
            anocalc: 2025,
            descricao: 'ESD Parque Dourado 34,5/13,8kV - Cabo OPDC',
            jan_meta_fisico: 0.72,
            fev_meta_fisico: 0.91,
            mar_meta_fisico: 0.9,
            abr_meta_fisico: 0.97,
            mai_meta_fisico: 0.51,
            jun_meta_fisico: 0,
            jul_meta_fisico: 0,
            ago_meta_fisico: 0,
            set_meta_fisico: 0,
            out_meta_fisico: 0,
            nov_meta_fisico: 0,
            dez_meta_fisico: 0,
            carteira: 1.28,
          },
        ],
        totalGoals: 1,
        totalScheduled: 1,
        totalAccomplished: 0,
      };

      const expectedResponse = {
        statusCode: HttpStatus.OK,
        message: 'Metas RDA trazidas com sucesso',
        data: rdaGoalsResponse,
      };

      jest.spyOn(metasRdaService, 'get').mockResolvedValue(rdaGoalsResponse);

      const result = await metasController.getRdaGoals(filters);

      expect(metasRdaService.get).toHaveBeenCalledWith(filters);
      expect(result).toEqual(expectedResponse);
    });

    it('should correctly transform query params', async () => {
      const query = {
        regional: '1,2,3',
        parceira: '1,6',
        empreendimento: '3,6',
        ano: '2025',
      };

      const rdaGoalsDTO = plainToInstance(RdaGoalsDTO, query);

      await metasController.getGoals(rdaGoalsDTO);

      expect(rdaGoalsDTO.parceira).toStrictEqual([1, 6]);
      expect(rdaGoalsDTO.regional).toStrictEqual([1, 2, 3]);
      expect(rdaGoalsDTO.empreendimento).toStrictEqual([3, 6]);
      expect(rdaGoalsDTO.ano).toStrictEqual([2025]);

      expect(metasService.getGoals).toHaveBeenCalledWith(rdaGoalsDTO);
    });
  });
});
