import { AUXILIARY_BASE_REPOSITORY } from 'src/domain/repositories/IAuxiliaryBaseRepository';

import { Test, TestingModule } from '@nestjs/testing';

import {
  mockGetAuxiliaryBaseMarket,
  mockGetNotes,
  mockInsertAuxiliaryBaseNotesService,
  mockInsertNotesRequest,
} from '../mocks/mockAuxiliaryBaseRepository';
import {
  mockInsertAuxiliaryBaseMarket,
  mockMappedMarketWorks,
  mockMappedNotes,
} from '../mocks/mocksAuxiliaryBaseController';
import { BadRequestException } from '@nestjs/common';
import { FindExistingWorksService } from 'src/application/works/findExistingWorks.service';
import { AuxiliaryBaseService } from 'src/application/auxiliaryBase/auxiliaryBase.service';

describe('AuxiliaryBaseService', () => {
  let auxiliaryBaseService: AuxiliaryBaseService;
  let findExistingWorksService: FindExistingWorksService;

  const mockRepository = {
    insertNotes: jest.fn(),
    insertMarket: jest.fn(),
    getFator: jest.fn(),
    getAuxiliaryBaseNotes: jest.fn(),
    getAuxiliaryBaseMarket: jest.fn(),
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuxiliaryBaseService,
        { provide: AUXILIARY_BASE_REPOSITORY, useValue: mockRepository },
        {
          provide: FindExistingWorksService,
          useValue: {
            findExistingWorks: jest.fn(),
            findExistingOrders: jest.fn(),
          },
        },
      ],
    }).compile();

    auxiliaryBaseService =
      module.get<AuxiliaryBaseService>(AuxiliaryBaseService);
    findExistingWorksService = module.get<FindExistingWorksService>(
      FindExistingWorksService,
    );
  });

  it('should be defined', () => {
    expect(auxiliaryBaseService).toBeDefined();
  });

  describe('GetNotes', () => {
    it('should call method GetNotes and return the formatted note data', async () => {
      mockRepository.getAuxiliaryBaseNotes.mockResolvedValue(mockGetNotes);

      const result = await auxiliaryBaseService.getNotes(1);

      expect(mockRepository.getAuxiliaryBaseNotes).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMappedNotes);
    });
  });

  describe('getMarket', () => {
    it('should call method getMarket and return the formatted market data', async () => {
      mockRepository.getAuxiliaryBaseMarket.mockResolvedValue([
        mockGetAuxiliaryBaseMarket,
      ]);

      const result = await auxiliaryBaseService.getMarket(1);

      expect(mockRepository.getAuxiliaryBaseMarket).toHaveBeenCalledWith(1);
      expect(result).toEqual(mockMappedMarketWorks);
    });
  });

  describe('delete', () => {
    it('should call method getMarket and not return throw', async () => {
      await auxiliaryBaseService.delete('baseOv', 56);

      expect(mockRepository.delete).toHaveBeenCalledWith('baseOv', 56);
    });
  });

  describe('insertAuxiliaryBaseNotes', () => {
    it('should call method insertAuxiliaryBaseNotes and return default format if no data is sent', async () => {
      const result = await auxiliaryBaseService.insertAuxiliaryBaseNotes([]);

      expect(result).toEqual({
        insertedCount: 0,
        skippedNotes: [],
        skippedOrders: [],
      });
    });

    it('should call method insertAuxiliaryBaseNotes and return default format if no data is valid', async () => {
      jest
        .spyOn(findExistingWorksService, 'findExistingWorks')
        .mockResolvedValue(['16005338', '16004316']);
      jest
        .spyOn(findExistingWorksService, 'findExistingOrders')
        .mockResolvedValue([]);

      const result = await auxiliaryBaseService.insertAuxiliaryBaseNotes(
        mockInsertAuxiliaryBaseNotesService,
      );

      expect(result).toEqual({
        insertedCount: 0,
        skippedNotes: [],
        skippedOrders: [],
      });
      expect(mockRepository.insertNotes).not.toHaveBeenCalled();
    });

    it('should call method insertAuxiliaryBaseNotes and return default format if no data is valid', async () => {
      jest
        .spyOn(findExistingWorksService, 'findExistingWorks')
        .mockResolvedValue([]);
      jest
        .spyOn(findExistingWorksService, 'findExistingOrders')
        .mockResolvedValue([
          '170000023493',
          '190000025094',
          '150000003441',
          '190000025090',
        ]);

      const result = await auxiliaryBaseService.insertAuxiliaryBaseNotes(
        mockInsertAuxiliaryBaseNotesService,
      );

      expect(result).toEqual({
        insertedCount: 0,
        skippedNotes: [],
        skippedOrders: [],
      });
      expect(mockRepository.insertNotes).not.toHaveBeenCalled();
    });

    it('should call method insertAuxiliaryBaseNotes and return data with calculated values', async () => {
      const fatorMap = new Map<string, number>();
      fatorMap.set('10054751|X/004620', 1);
      fatorMap.set('10054768|X/004620', 1);

      jest
        .spyOn(findExistingWorksService, 'findExistingWorks')
        .mockResolvedValue([]);
      jest
        .spyOn(findExistingWorksService, 'findExistingOrders')
        .mockResolvedValue([]);
      mockRepository.getFator.mockResolvedValue(fatorMap);

      const result = await auxiliaryBaseService.insertAuxiliaryBaseNotes(
        mockInsertAuxiliaryBaseNotesService,
      );

      expect(result).toEqual({
        insertedCount: 2,
        skippedNotes: [],
        skippedOrders: [],
      });
      expect(mockRepository.insertNotes).toHaveBeenCalledWith(
        mockInsertNotesRequest,
      );
    });
  });

  describe('insertAuxiliaryBaseMarket', () => {
    it('should call method insertAuxiliaryBaseMarket and return undefined if no data is sent', async () => {
      await expect(
        auxiliaryBaseService.insertAuxiliaryBaseMarket([]),
      ).rejects.toThrow('Nenhum dado enviado.');
    });

    it('should call method insertAuxiliaryBaseMarket and throw error if no data is valid', async () => {
      jest
        .spyOn(findExistingWorksService, 'findExistingWorks')
        .mockResolvedValue(['14245355']);

      await expect(
        auxiliaryBaseService.insertAuxiliaryBaseMarket(
          mockInsertAuxiliaryBaseMarket,
        ),
      ).rejects.toThrow(BadRequestException);

      await expect(
        auxiliaryBaseService.insertAuxiliaryBaseMarket(
          mockInsertAuxiliaryBaseMarket,
        ),
      ).rejects.toThrow(
        `Todas as obras já existem no banco de dados: ${mockInsertAuxiliaryBaseMarket.map((item) => item.obra).join(', ')}`,
      );

      expect(findExistingWorksService.findExistingWorks).toHaveBeenCalledWith([
        '14245355',
      ]);
    });

    it('should call method insertAuxiliaryBaseMarket and call repository method with new data', async () => {
      jest
        .spyOn(findExistingWorksService, 'findExistingWorks')
        .mockResolvedValue(['1424535']);

      const result = await auxiliaryBaseService.insertAuxiliaryBaseMarket(
        mockInsertAuxiliaryBaseMarket,
      );

      expect(mockRepository.insertMarket).toHaveBeenCalledWith(
        mockInsertAuxiliaryBaseMarket,
      );
      expect(result).toBeUndefined();
    });
  });
});
