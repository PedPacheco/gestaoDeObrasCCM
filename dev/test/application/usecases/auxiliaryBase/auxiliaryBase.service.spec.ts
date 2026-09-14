import { AuxiliaryBaseService } from 'src/application/usecases/auxiliaryBase/auxiliaryBase.service';
import { AuxiliaryMarketInsertService } from 'src/application/usecases/auxiliaryBase/auxiliaryBaseInsertMarket.service';
import { AuxiliaryNotesInsertService } from 'src/application/usecases/auxiliaryBase/auxiliaryBaseInsertNotes.service';
import { AUXILIARY_BASE_REPOSITORY } from 'src/domain/contracts/IAuxiliaryBaseRepository';

import { Test, TestingModule } from '@nestjs/testing';

import {
  mockGetAuxiliaryBaseMarket,
  mockGetNotes,
} from '../../../mocks/mockAuxiliaryBaseRepository';
import {
  mockInsertAuxiliaryBaseMarket,
  mockInsertAuxiliaryBaseNotes,
  mockMappedMarketWorks,
  mockMappedNotes,
} from '../../../mocks/mocksAuxiliaryBaseController';

describe('AuxiliaryBaseService', () => {
  let auxiliaryBaseService: AuxiliaryBaseService;

  const mockRepository = {
    insertNotes: jest.fn(),
    insertMarket: jest.fn(),
    insertCapex: jest.fn(),
    getFator: jest.fn(),
    getAuxiliaryBaseNotes: jest.fn(),
    getAuxiliaryBaseMarket: jest.fn(),
    getObraIdsByDiagramas: jest.fn(),
    delete: jest.fn(),
  };

  const mockAuxiliaryNotesInsertService = {
    execute: jest.fn(),
  };

  const mockAuxiliaryMarketInsertService = {
    execute: jest.fn(),
  };

  const mockAuxiliaryNotesInsertResult = {
    insertedCount: 3,
    skippedNotes: ['4001841383', '4001854143'],
    skippedOrders: ['DCI001', 'DCD002'],
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuxiliaryBaseService,
        {
          provide: AuxiliaryMarketInsertService,
          useValue: mockAuxiliaryMarketInsertService,
        },
        {
          provide: AuxiliaryNotesInsertService,
          useValue: mockAuxiliaryNotesInsertService,
        },
        { provide: AUXILIARY_BASE_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    auxiliaryBaseService =
      module.get<AuxiliaryBaseService>(AuxiliaryBaseService);
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
    it('should delegate insertion of auxiliary base notes to AuxiliaryNotesInsertService and return inserted count, skipped notes, and skipped orders', async () => {
      mockAuxiliaryNotesInsertService.execute.mockResolvedValue(
        mockAuxiliaryNotesInsertResult,
      );

      const result = await auxiliaryBaseService.insertAuxiliaryBaseNotes(
        mockInsertAuxiliaryBaseNotes,
        'insert',
      );

      expect(mockAuxiliaryNotesInsertService.execute).toHaveBeenCalledWith(
        mockInsertAuxiliaryBaseNotes,
        'insert',
      );
      expect(result).toEqual(mockAuxiliaryNotesInsertResult);
    });
  });

  describe('insertAuxiliaryBaseMarket', () => {
    it('should delegate insertion of auxiliary base market to AuxiliaryMarketInsertService and return data', async () => {
      await auxiliaryBaseService.insertAuxiliaryBaseMarket(
        mockInsertAuxiliaryBaseMarket,
        'insert',
      );

      expect(mockAuxiliaryMarketInsertService.execute).toHaveBeenCalledWith(
        mockInsertAuxiliaryBaseMarket,
        'insert',
      );
    });
  });

  // describe('InsertAuxiliaryBaseCapex', () => {
  //   it('Should format data and call repository to insert materials', async () => {
  //     mockRepository.getObraIdsByDiagramas.mockResolvedValue(
  //       mockGetObraIdsByDiagramas,
  //     );

  //     await auxiliaryBaseService.(mockMaterialCapex);

  //     expect(mockRepository.insertCapex).toHaveBeenCalledWith(
  //       mockMaterialCapexRequest,
  //     );
  //   });

  //   it('Should format data and call repository to insert materials', async () => {
  //     mockRepository.getObraIdsByDiagramas.mockResolvedValue(
  //       mockGetWrongObraIdsByDiagramas,
  //     );

  //     await auxiliaryBaseService.insertAuxiliaryBaseCapex(mockMaterialCapex);

  //     const mockMaterialCapexRequestWithNull = mockMaterialCapexRequest.map(
  //       (item) => ({
  //         ...item,
  //         id_obra: null,
  //       }),
  //     );

  //     expect(mockRepository.insertCapex).toHaveBeenCalledWith(
  //       mockMaterialCapexRequestWithNull,
  //     );
  //   });
  // });
});
