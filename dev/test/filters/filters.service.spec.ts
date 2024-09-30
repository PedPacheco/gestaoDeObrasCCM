import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Test } from '@nestjs/testing';
import { FiltersService } from 'src/modules/filters/filters.service';
import { PrismaService } from 'src/config/prisma/prisma.service';

describe('FiltersService', () => {
  let mockCacheManager: Cache;
  let filtersService: FiltersService;
  let prismaService: PrismaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        FiltersService,
        PrismaService,
        { provide: CACHE_MANAGER, useValue: mockCacheManager },
      ],
    }).compile();

    filtersService = module.get<FiltersService>(FiltersService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  describe('getFilters', () => {
    it('should call methods to obtain values filters', async () => {
      const params = { regionais: true, parceiras: true, tiposObra: true };

      const mockRegionais = [{ id: 1, regional: 'São José dos campos' }];
      const mockParceiras = [{ id: 1, turma: 'Engelmig' }];
      const mockTipoObra = [{ id: 1, tipo_obra: 'NÃO DEFINIDO' }];

      const response = {
        regionais: mockRegionais,
        parceiras: mockParceiras,
        tiposObra: mockTipoObra,
      };

      jest
        .spyOn(filtersService, 'getRegionais')
        .mockResolvedValue(mockRegionais);
      jest
        .spyOn(filtersService, 'getParceiras')
        .mockResolvedValue(mockParceiras);
      jest
        .spyOn(filtersService, 'getTiposObra')
        .mockResolvedValue(mockTipoObra);

      const result = await filtersService.getFilters(params);

      expect(result).toEqual(response);
      expect(filtersService.getRegionais).toHaveBeenCalled();
      expect(filtersService.getParceiras).toHaveBeenCalled();
      expect(filtersService.getTiposObra).toHaveBeenCalled();
    });
  });

  describe('getRegionais', () => {
    it('Should get values of regionais', async () => {
      const mockRegionais = [
        {
          id: 1,
          regional: 'São José dos Campos',
          csd: undefined,
          gestor: undefined,
          engenheiro: undefined,
          total_clientes: undefined,
          centro: undefined,
          abrev_regional: undefined,
        },
      ];

      jest
        .spyOn(prismaService.regionais, 'findMany')
        .mockResolvedValue(mockRegionais);

      const result = await filtersService.getRegionais();

      expect(result).toEqual(mockRegionais);
      expect(prismaService.regionais.findMany).toHaveBeenCalledWith({
        select: { id: true, regional: true },
      });
    });

    it('should handle errors when getting regionais', async () => {
      jest
        .spyOn(prismaService.regionais, 'findMany')
        .mockRejectedValue(new Error('Database error'));

      await expect(filtersService.getRegionais()).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getTiposObra', () => {
    it('Should get values of tipos', async () => {
      const mockTiposObra = [
        {
          id: 1,
          tipo_obra: 'NÃO DEFINIDO',
          tipo_abrev: undefined,
          descricao_sap: undefined,
          id_grupo: 1,
          pep_atual: undefined,
          pep_antigo: undefined,
          id_subgrupo: 1,
          tipo_serv_sap: undefined,
          regulado: undefined,
        },
      ];

      jest
        .spyOn(prismaService.tipos, 'findMany')
        .mockResolvedValue(mockTiposObra);

      const result = await filtersService.getTiposObra();

      expect(result).toEqual(mockTiposObra);
      expect(prismaService.tipos.findMany).toHaveBeenCalledWith({
        select: { id: true, tipo_obra: true, id_grupo: true },
      });
    });

    it('should handle errors when getting tipos', async () => {
      jest
        .spyOn(prismaService.tipos, 'findMany')
        .mockRejectedValue(new Error('Database error'));

      await expect(filtersService.getTiposObra()).rejects.toThrow(
        'Database error',
      );
    });
  });

  describe('getParceiras', () => {
    it('Should get values of parceiras', async () => {
      const mockParceiras = [
        {
          id: 1,
          turma: 'ENGELMIG',
          turma_abrev: undefined,
          deposito_atual: undefined,
          turma_sap: undefined,
          contrato: undefined,
          email_referencia: undefined,
        },
      ];

      jest
        .spyOn(prismaService.turmas, 'findMany')
        .mockResolvedValue(mockParceiras);

      const result = await filtersService.getParceiras();

      expect(result).toEqual(mockParceiras);
      expect(prismaService.turmas.findMany).toHaveBeenCalledWith({
        select: { id: true, turma: true },
      });
    });

    it('should handle errors when getting parceiras', async () => {
      jest
        .spyOn(prismaService.turmas, 'findMany')
        .mockRejectedValue(new Error('Database error'));

      await expect(filtersService.getParceiras()).rejects.toThrow(
        'Database error',
      );
    });
  });
});
