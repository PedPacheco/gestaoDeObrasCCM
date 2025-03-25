import { Test } from '@nestjs/testing';
import { RdaGoalsService } from 'src/domain/services/goals/rdaGoals.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { RdaGoalsDTO } from 'src/interface/dtos/goalsDto';

describe('RdaGoalsService', () => {
  let rdaGoalsService: RdaGoalsService;
  let prismaService: PrismaService;

  const responsePrisma = [
    {
      empreendimento: 'PINDAMONHANGABA - RDA PID 1390',
      tipo_obra: 'RDA EXTENSÃO REDE AEREA',
      turma: 'START-TAU',
      regional: 'Guaratinguetá',
      anocalc: 2025,
      descricao: 'RDA PID 1390 - Construir Rede 15 KV - RCAL 185',
      jan_meta_fisico: 0.41,
      fev_meta_fisico: 0.41,
      mar_meta_fisico: 0.41,
      abr_meta_fisico: 0.41,
      mai_meta_fisico: 0.41,
      jun_meta_fisico: 0.41,
      jul_meta_fisico: 0.41,
      ago_meta_fisico: 0.41,
      set_meta_fisico: 0.41,
      out_meta_fisico: 0.41,
      nov_meta_fisico: 0.41,
      dez_meta_fisico: 0.41,
      janfisprog: 0,
      fevfisprog: 0,
      marfisprog: 0.10499999999999998,
      abrfisprog: 10.995000000000005,
      maifisprog: 0,
      junfisprog: 0,
      julfisprog: 0,
      agofisprog: 0,
      setfisprog: 0,
      outfisprog: 0,
      novfisprog: 0,
      dezfisprog: 0,
      janfisreal: 0,
      fevfisreal: 0,
      marfisreal: 0,
      abrfisreal: 0,
      maifisreal: 0,
      junfisreal: 0,
      julfisreal: 0,
      agofisreal: 0,
      setfisreal: 0,
      outfisreal: 0,
      novfisreal: 0,
      dezfisreal: 0,
      carteira: 18.134999999999998,
    },
    {
      empreendimento: 'PINDAMONHANGABA - RDA PID 1390',
      tipo_obra: 'RDA EXTENSÃO REDE AEREA',
      turma: 'START-TAU',
      regional: 'Guaratinguetá',
      anocalc: 2025,
      descricao: 'RDA PID 1390 - Instalar RE MT 15 kV',
      jan_meta_fisico: 0,
      fev_meta_fisico: 0,
      mar_meta_fisico: 0,
      abr_meta_fisico: 0,
      mai_meta_fisico: 0,
      jun_meta_fisico: 0,
      jul_meta_fisico: 0,
      ago_meta_fisico: 0,
      set_meta_fisico: 2,
      out_meta_fisico: 2,
      nov_meta_fisico: 1,
      dez_meta_fisico: 0,
      janfisprog: 0,
      fevfisprog: 0,
      marfisprog: 0.10499999999999998,
      abrfisprog: 10.995000000000005,
      maifisprog: 0,
      junfisprog: 0,
      julfisprog: 0,
      agofisprog: 0,
      setfisprog: 0,
      outfisprog: 0,
      novfisprog: 0,
      dezfisprog: 0,
      janfisreal: 0,
      fevfisreal: 0,
      marfisreal: 0,
      abrfisreal: 0,
      maifisreal: 0,
      junfisreal: 0,
      julfisreal: 0,
      agofisreal: 0,
      setfisreal: 0,
      outfisreal: 0,
      novfisreal: 0,
      dezfisreal: 0,
      carteira: 18.134999999999998,
    },
  ];

  beforeEach(async () => {
    jest.resetAllMocks();

    const module = await Test.createTestingModule({
      providers: [RdaGoalsService, PrismaService],
    }).compile();

    rdaGoalsService = module.get<RdaGoalsService>(RdaGoalsService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('get method', () => {
    it('Should return rda goals', async () => {
      const filters: RdaGoalsDTO = {
        regional: [1, 2, 3],
        parceira: [2],
        empreendimento: [3, 5],
        ano: [2024],
      };
    });
  });
});
