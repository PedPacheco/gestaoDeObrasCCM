import { FIND_EXISITING_WORKS_REPOSITORY } from 'src/domain/repositories/works/IFindExistingWorksRepository';
import { Test, TestingModule } from '@nestjs/testing';
import { FindExistingWorksService } from 'src/application/works/findExistingWorks.service';

describe('FindExistingWorksService', () => {
  let findExistingWorksService: FindExistingWorksService;

  const mockRepository = {
    findExistingWorks: jest.fn(),
    findExistingOrders: jest.fn(),
  };

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
