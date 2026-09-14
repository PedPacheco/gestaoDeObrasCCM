import { AuxiliaryNotesInsertService } from 'src/application/usecases/auxiliaryBase/auxiliaryBaseInsertNotes.service';
import { FindExistingWorksService } from 'src/application/usecases/works/findExistingWorks.service';
import { AUXILIARY_BASE_REPOSITORY } from 'src/domain/contracts/IAuxiliaryBaseRepository';

import { Test, TestingModule } from '@nestjs/testing';

import {
  mockInsertAuxiliaryBaseNotesService,
  mockInsertNotesRequest,
} from '../../../mocks/mockAuxiliaryBaseRepository';

describe('AuxiliaryNotesInsertService', () => {
  let auxiliaryNotesInsertService: AuxiliaryNotesInsertService;

  const mockRepository = {
    insertNotes: jest.fn(),
    getFator: jest.fn(),
    delete: jest.fn(),
  };

  const mockFindExistingWorksService = {
    findExistingWorks: jest.fn(),
    findExistingOrders: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuxiliaryNotesInsertService,
        { provide: AUXILIARY_BASE_REPOSITORY, useValue: mockRepository },
        {
          provide: FindExistingWorksService,
          useValue: mockFindExistingWorksService,
        },
      ],
    }).compile();

    auxiliaryNotesInsertService = module.get<AuxiliaryNotesInsertService>(
      AuxiliaryNotesInsertService,
    );
  });

  afterEach(jest.clearAllMocks);

  describe('execute', () => {
    it('should call method insertAuxiliaryBaseNotes and return default format if no data is sent', async () => {
      const result = await auxiliaryNotesInsertService.execute([], 'insert');

      expect(result).toEqual({
        insertedCount: 0,
        skippedNotes: [],
      });
    });

    it('should call method insertAuxiliaryBaseNotes and return default format if no data is valid with the insert operation', async () => {
      mockFindExistingWorksService.findExistingWorks.mockResolvedValue([
        { id: 1, ovnota: '16005338' },
        { id: 2, ovnota: '16004316' },
      ]);

      mockFindExistingWorksService.findExistingOrders.mockResolvedValue([
        '170000023493',
        '190000025094',
        '150000003441',
        '190000025090',
      ]);

      const result = await auxiliaryNotesInsertService.execute(
        mockInsertAuxiliaryBaseNotesService,
        'insert',
      );

      expect(result).toEqual({
        insertedCount: 0,
        skippedNotes: ['16005338', '16004316'],
      });
      expect(mockRepository.insertNotes).not.toHaveBeenCalled();
    });

    it('should call method insertAuxiliaryBaseNotes and return data with calculated values with the insert operation', async () => {
      const fatorMap = new Map<string, number>();
      fatorMap.set('10054751|X/004620', 1);
      fatorMap.set('10054768|X/004620', 1);

      mockFindExistingWorksService.findExistingWorks.mockResolvedValue([]);

      mockFindExistingWorksService.findExistingOrders.mockResolvedValue([]);
      mockRepository.getFator.mockResolvedValue(fatorMap);

      const result = await auxiliaryNotesInsertService.execute(
        mockInsertAuxiliaryBaseNotesService,
        'insert',
      );

      expect(result).toEqual({
        insertedCount: 2,
        skippedNotes: [],
      });
      expect(mockRepository.insertNotes).toHaveBeenCalledWith(
        mockInsertNotesRequest,
      );
    });

    it('should call method insertAuxiliaryBaseNotes and return default format if no data is valid with the update operation', async () => {
      mockFindExistingWorksService.findExistingWorks.mockResolvedValue([]);

      mockFindExistingWorksService.findExistingOrders.mockResolvedValue([
        '170000023492',
        '190000025095',
        '150000003440',
        '190000025095',
      ]);

      const result = await auxiliaryNotesInsertService.execute(
        mockInsertAuxiliaryBaseNotesService,
        'update',
      );

      expect(result).toEqual({
        insertedCount: 0,
        skippedNotes: ['16005338', '16004316'],
      });
      expect(mockRepository.insertNotes).not.toHaveBeenCalled();
    });

    it('should call method insertAuxiliaryBaseNotes and return data with calculated values with update operation', async () => {
      mockFindExistingWorksService.findExistingWorks.mockResolvedValue([
        { id: 1, ovnota: '16005338' },
        { id: 2, ovnota: '16004316' },
      ]);

      mockFindExistingWorksService.findExistingOrders.mockResolvedValue([
        '170000023493',
        '190000025094',
        '150000003441',
        '190000025090',
      ]);

      const result = await auxiliaryNotesInsertService.execute(
        mockInsertAuxiliaryBaseNotesService,
        'update',
      );

      expect(result).toEqual({
        insertedCount: 2,
        skippedNotes: [],
      });
      expect(mockRepository.insertNotes).toHaveBeenCalledWith(
        mockInsertNotesRequest,
      );
    });
  });
});
