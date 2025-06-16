import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { mockUpdateSchedulesServiceFormattedData } from '../../../../test/mocks/mockAddScheduleService';
import { UpdateSchedulesRepository } from 'src/infra/repositories/schedule/updateSchedulesRepository';

describe('UpdateSchedulesRepository', () => {
  let repository: UpdateSchedulesRepository;

  const mockPrisma = {
    programacoes: { update: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateSchedulesRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<UpdateSchedulesRepository>(
      UpdateSchedulesRepository,
    );
  });

  afterEach(jest.clearAllMocks);

  describe('UpdateSchedules', () => {
    it('Should call method update and return count of data created', async () => {
      mockPrisma.programacoes.update.mockResolvedValue({ count: 2 });

      await repository.update(mockUpdateSchedulesServiceFormattedData);

      expect(mockPrisma.programacoes.update).toHaveBeenCalledWith({
        where: { id: mockUpdateSchedulesServiceFormattedData.id },
        data: mockUpdateSchedulesServiceFormattedData,
      });
    });
  });
});
