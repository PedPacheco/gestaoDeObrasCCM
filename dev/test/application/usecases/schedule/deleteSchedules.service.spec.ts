import { DeleteSchedulesService } from 'src/application/usecases/schedule/deleteSchedules.service';
import { DELETE_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IDeleteSchedulesRepository';

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('DeleteSchedulesService', () => {
  let deleteSchedulesService: DeleteSchedulesService;

  const mockRepository = {
    delete: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DeleteSchedulesService,
        { provide: DELETE_SCHEDULES_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    deleteSchedulesService = module.get<DeleteSchedulesService>(
      DeleteSchedulesService,
    );
  });

  afterEach(jest.clearAllMocks);

  describe('delete', () => {
    it('Should call method delete and throw BadRequestExpection if no id is sent', async () => {
      await expect(deleteSchedulesService.delete(null)).rejects.toThrow(
        BadRequestException,
      );

      await expect(deleteSchedulesService.delete(null)).rejects.toThrow(
        'Nenhuma programação fornecida para exclusão.',
      );
    });

    it('should call method delete and call repository', async () => {
      await deleteSchedulesService.delete(1);

      expect(mockRepository.delete).toHaveBeenCalledWith(1);
    });
  });
});
