import { AuxiliaryMarketInsertService } from 'src/application/usecases/auxiliaryBase/auxiliaryBaseInsertMarket.service';
import { FindExistingWorksService } from 'src/application/usecases/works/findExistingWorks.service';
import { AUXILIARY_BASE_REPOSITORY } from 'src/domain/repositories/IAuxiliaryBaseRepository';

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { mockInsertAuxiliaryBaseMarket } from '../../../mocks/mocksAuxiliaryBaseController';

describe('AuxiliaryMarketInsertService', () => {
  let auxiliaryMarketInsertService: AuxiliaryMarketInsertService;

  const mockRepository = {
    insertMarket: jest.fn(),
  };

  const mockFindExistingWorksService = {
    findExistingWorks: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuxiliaryMarketInsertService,
        { provide: AUXILIARY_BASE_REPOSITORY, useValue: mockRepository },
        {
          provide: FindExistingWorksService,
          useValue: mockFindExistingWorksService,
        },
      ],
    }).compile();

    auxiliaryMarketInsertService = module.get<AuxiliaryMarketInsertService>(
      AuxiliaryMarketInsertService,
    );
  });

  describe('execute', () => {
    it('should call method execute and return undefined if no data is sent', async () => {
      await expect(
        auxiliaryMarketInsertService.execute([], 'insert'),
      ).rejects.toThrow('Nenhum dado enviado.');
    });

    it('should call method insertAuxiliaryBaseMarket and throw error if no data is valid with the insert operation', async () => {
      mockFindExistingWorksService.findExistingWorks.mockResolvedValue([
        { id: 1, ovnota: '14245355' },
      ]);

      await expect(
        auxiliaryMarketInsertService.execute(
          mockInsertAuxiliaryBaseMarket,
          'insert',
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        auxiliaryMarketInsertService.execute(
          mockInsertAuxiliaryBaseMarket,
          'insert',
        ),
      ).rejects.toThrow(
        `Todas as obras já existem no banco de dados: ${mockInsertAuxiliaryBaseMarket.map((item) => item.obra).join(', ')}`,
      );

      expect(
        mockFindExistingWorksService.findExistingWorks,
      ).toHaveBeenCalledWith(['14245355']);
    });

    it('should call method insertAuxiliaryBaseMarket and call repository method with new data with the insert operation', async () => {
      mockFindExistingWorksService.findExistingWorks.mockResolvedValue([
        { id: 1, ovnota: '14245352' },
      ]);

      const result = await auxiliaryMarketInsertService.execute(
        mockInsertAuxiliaryBaseMarket,
        'insert',
      );

      expect(mockRepository.insertMarket).toHaveBeenCalledWith(
        mockInsertAuxiliaryBaseMarket,
      );
      expect(result).toBeUndefined();
    });

    it('should call method insertAuxiliaryBaseMarket and throw error if no data is valid with the update operation', async () => {
      mockFindExistingWorksService.findExistingWorks.mockResolvedValue([
        { id: 1, ovnota: '14245352' },
      ]);

      await expect(
        auxiliaryMarketInsertService.execute(
          mockInsertAuxiliaryBaseMarket,
          'update',
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        auxiliaryMarketInsertService.execute(
          mockInsertAuxiliaryBaseMarket,
          'update',
        ),
      ).rejects.toThrow(
        `Não foi possível atualizar. Obras não encontradas: ${mockInsertAuxiliaryBaseMarket.map((item) => item.obra).join(', ')}`,
      );

      expect(
        mockFindExistingWorksService.findExistingWorks,
      ).toHaveBeenCalledWith(['14245355']);
    });

    it('should call method insertAuxiliaryBaseMarket and call repository method with new data with the update operation', async () => {
      mockFindExistingWorksService.findExistingWorks.mockResolvedValue([
        { id: 1, ovnota: '14245355' },
      ]);

      const result = await auxiliaryMarketInsertService.execute(
        mockInsertAuxiliaryBaseMarket,
        'update',
      );

      expect(mockRepository.insertMarket).toHaveBeenCalledWith(
        mockInsertAuxiliaryBaseMarket,
      );
      expect(result).toBeUndefined();
    });
  });
});
