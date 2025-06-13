import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { AddSchedulesRepository } from 'src/infra/repositories/schedule/addSchedulesRepository';
import { mockAddSchedulesServiceFormattedData } from '../../../../test/mocks/mockAddScheduleService';

describe('AddSchedulesRepository', () => {
  let repository: AddSchedulesRepository;

  const mockPrisma = {
    programacoes: { create: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AddSchedulesRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<AddSchedulesRepository>(AddSchedulesRepository);
  });

  afterEach(jest.clearAllMocks);

  describe('addSchedules', () => {
    it('Should call method addSchedules and return count of data created', async () => {
      mockPrisma.programacoes.create.mockResolvedValue({ count: 2 });

      await repository.addSchedules(mockAddSchedulesServiceFormattedData);

      expect(mockPrisma.programacoes.create).toHaveBeenCalledWith({
        data: mockAddSchedulesServiceFormattedData,
      });
    });

    it('Should call method addSchedules and throw error', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();
      mockPrisma.programacoes.create.mockRejectedValueOnce(
        new Error('DB error'),
      );

      await repository.addSchedules(null as any);

      expect(spy).toHaveBeenCalledWith(
        'Erro ao inserir programacões:',
        expect.any(Error),
      );
    });
  });
});
