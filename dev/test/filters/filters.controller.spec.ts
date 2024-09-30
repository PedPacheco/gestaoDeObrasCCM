import { Test, TestingModule } from '@nestjs/testing';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { FiltersDto } from 'src/config/dto/filters/filtersDto';
import { FiltersController } from 'src/filters/filters.controller';
import { FiltersService } from 'src/modules/filters/filters.service';

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
      parceiras: false,
      regionais: true,
      tiposObra: true,
    };

    jest.spyOn(filtersService, 'getFilters').mockResolvedValue(response);

    const result = await filtersController.getFilters(filtersDTO);

    expect(result).toEqual(response);
    expect(filtersService.getFilters).toHaveBeenCalledWith({
      regionais: true,
      parceiras: false,
      tiposObra: true,
    });
  });

  it.each([
    [
      { parceiras: 'false', regionais: 'false', tiposObra: 'false' },
      false,
      false,
      false,
    ],
    [
      { parceiras: 'true', regionais: 'true', tiposObra: 'true' },
      true,
      true,
      true,
    ],
    [
      { parceiras: undefined, regionais: undefined, tiposObra: undefined },
      undefined,
      undefined,
      undefined,
    ],
  ])(
    'should correctly transform query params to boolean',
    async (query, expectedParceiras, expectedRegionais, expectedTiposObra) => {
      const filtersDTO = plainToInstance(FiltersDto, query);

      await filtersController.getFilters(filtersDTO);

      expect(filtersDTO.parceiras).toBe(expectedParceiras);
      expect(filtersDTO.regionais).toBe(expectedRegionais);
      expect(filtersDTO.tiposObra).toBe(expectedTiposObra);

      expect(filtersService.getFilters).toHaveBeenCalledWith(filtersDTO);
    },
  );

  it('should handle invalid query params', async () => {
    const query = {
      parceiras: 'invalid',
      regionais: 'invalid',
      tiposObra: 'invalid',
    };

    const filtersDTO = plainToInstance(FiltersDto, query);

    expect(filtersDTO.parceiras).toBe('invalid');
    expect(filtersDTO.regionais).toBe('invalid');
    expect(filtersDTO.tiposObra).toBe('invalid');

    const errors = await validate(filtersDTO);

    expect(errors.length).toBeGreaterThan(0);
    expect(errors.some((err) => err.property === 'parceiras')).toBe(true);
    expect(errors.some((err) => err.property === 'regionais')).toBe(true);
    expect(errors.some((err) => err.property === 'tiposObra')).toBe(true);

    expect(filtersService.getFilters).not.toHaveBeenCalled();
  });
});
