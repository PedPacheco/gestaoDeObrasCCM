import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { FiltersDto } from 'src/config/dto/filtersDto';
import { FiltersController } from 'src/modules/filters/filters.controller';
import { FiltersService } from 'src/modules/filters/filters.service';
import { UsersService } from 'src/modules/users/users.service';

describe('FiltersController', () => {
  let filtersController: FiltersController;
  let filtersService: FiltersService;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [FiltersController],
      providers: [
        {
          provide: FiltersService,
          useValue: {
            getFilters: jest.fn(),
          },
        },
        { provide: UsersService, useValue: { findUser: jest.fn() } },
      ],
    }).compile();

    filtersController = module.get<FiltersController>(FiltersController);
    filtersService = module.get<FiltersService>(FiltersService);
  });

  it('Should be defined', () => {
    expect(FiltersController).toBeDefined();
  });

  it('should return object with filters values', async () => {
    const response = {
      regionais: [
        {
          id: 1,
          regional: 'São José dos Campos',
        },
        {
          id: 2,
          regional: 'Mogi das Cruzes',
        },
      ],
      tiposObra: [
        {
          id: 1,
          tipo_obra: 'NÃO DEFINIDO',
        },
        {
          id: 2,
          tipo_obra: 'POSTE COM BF',
        },
      ],
    };

    const filtersDTO: FiltersDto = {
      parceira: false,
      regional: true,
      tipo: true,
    };

    jest.spyOn(filtersService, 'getFilters').mockResolvedValue(response);

    const req = { query: { idRegional: 1 } };

    const result = await filtersController.getFilters(filtersDTO, req);

    expect(result).toEqual(response);
    expect(filtersService.getFilters).toHaveBeenCalledWith(
      {
        regional: true,
        parceira: false,
        tipo: true,
      },
      req.query.idRegional,
    );
  });

  it.each([
    [
      {
        parceira: 'false',
        regional: 'false',
        tipo: 'false',
        municipio: 'false',
        grupo: 'false',
        circuito: 'false',
        status: 'false',
        conjunto: 'false',
        ovnota: 'false',
        ovnotaExec: 'false',
        empreendimento: 'false',
      },
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
      false,
    ],
    [
      {
        parceira: 'true',
        regional: 'true',
        tipo: 'true',
        municipio: 'true',
        grupo: 'true',
        circuito: 'true',
        status: 'true',
        conjunto: 'true',
        ovnota: 'true',
        ovnotaExec: 'true',
        empreendimento: 'true',
      },
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ],
    [
      {
        parceira: undefined,
        regional: undefined,
        tipo: undefined,
        municipio: undefined,
        grupo: undefined,
        circuito: undefined,
        status: undefined,
        conjunto: undefined,
        ovnota: undefined,
        ovnotaExec: undefined,
        empreendimento: undefined,
      },
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
    ],
  ])(
    'should correctly transform query params to boolean',
    async (
      query,
      expectedParceiras,
      expectedRegionais,
      expectedTiposObra,
      expectedMunicipio,
      expectedGrupo,
      expectedCircuito,
      expectedStatus,
      expectedConjunto,
      expectedOvnota,
      expectedOvnotaExec,
      expectedEmpreendimento,
    ) => {
      const filtersDTO = plainToInstance(FiltersDto, query);

      const req = { query: { idRegional: 1 } };

      await filtersController.getFilters(filtersDTO, req);

      expect(filtersDTO.parceira).toBe(expectedParceiras);
      expect(filtersDTO.regional).toBe(expectedRegionais);
      expect(filtersDTO.tipo).toBe(expectedTiposObra);
      expect(filtersDTO.circuito).toBe(expectedCircuito);
      expect(filtersDTO.conjunto).toBe(expectedConjunto);
      expect(filtersDTO.empreendimento).toBe(expectedEmpreendimento);
      expect(filtersDTO.grupo).toBe(expectedGrupo);
      expect(filtersDTO.municipio).toBe(expectedMunicipio);
      expect(filtersDTO.ovnota).toBe(expectedOvnota);
      expect(filtersDTO.ovnotaExec).toBe(expectedOvnotaExec);
      expect(filtersDTO.status).toBe(expectedStatus);

      expect(filtersService.getFilters).toHaveBeenCalledWith(
        filtersDTO,
        req.query.idRegional,
      );
    },
  );
});
