import { FindExistingWorksService } from 'src/application/usecases/works/management/findExistingWorks.service';
import { FIND_EXISITING_WORKS_REPOSITORY } from 'src/domain/repositories/works/IFindExistingWorksRepository';

import { Test, TestingModule } from '@nestjs/testing';

describe('FindExistingWorksService', () => {
  let findExistingWorksService: FindExistingWorksService;

  const mockRepository = {
    findExistingWorks: jest.fn(),
    findExistingNotes: jest.fn(),
    findExistingOrders: jest.fn(),
    findExistingWorksOnSuspension: jest.fn(),
  };

  const mockExistingNotes = [
    {
      id: 1,
      ovnota: '16005338',
      ordemDci: '170000023493',
      ordemDcd: '190000025090',
      ordemDca: '150000003441',
      ordemDcim: null,
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FindExistingWorksService,
        { provide: FIND_EXISITING_WORKS_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    findExistingWorksService = module.get<FindExistingWorksService>(
      FindExistingWorksService,
    );
  });

  describe('findExistingMarketWorks', () => {
    it('should call method findExistingMarketWorks and return the existing market works data', async () => {
      mockRepository.findExistingWorks.mockResolvedValue(['12355366']);

      const result = await findExistingWorksService.findExistingWorks([
        '12355366',
      ]);

      expect(result).toEqual(['12355366']);
    });
  });

  describe('findExistingOnSuspension', () => {
    it('should call method findExistingOnSuspension and return the existing market works data', async () => {
      mockRepository.findExistingWorksOnSuspension.mockResolvedValue([
        { id: 1, ovnota: '12355366' },
      ]);

      const result =
        await findExistingWorksService.findExistingWorksOnSuspension([
          { ovnota: '12355366', ordemDiagrama: '19000000' },
        ]);

      expect(result).toEqual([{ id: 1, ovnota: '12355366' }]);
    });
  });

  describe('findExistingNotes', () => {
    it('should call method findExistingNotes and return the existing notes data', async () => {
      mockRepository.findExistingNotes.mockResolvedValue(mockExistingNotes);

      const result = await findExistingWorksService.findExistingNotes([
        {
          ovnota: '12355366',
          ordem_dci: '170000023493',
          ordem_dcd: '190000025090',
          ordem_dca: '150000003441',
        },
      ]);

      expect(result).toEqual(mockExistingNotes);
    });
  });

  describe('findExistingOrders', () => {
    it('should call method findExistingOrders and return the existing orders data', async () => {
      mockRepository.findExistingOrders.mockResolvedValue([
        '1253536',
        '421435',
        '5434356',
        '535465',
      ]);

      const result = await findExistingWorksService.findExistingOrders([
        {
          ordem_dci: '1253536',
          ordem_dcd: '421435',
          ordem_dca: '5434356',
          ordem_dcim: '535465',
        },
      ]);

      expect(result).toEqual(['1253536', '421435', '5434356', '535465']);
    });
  });
});
