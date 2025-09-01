import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ValidateAndConfirmSchedulesService } from 'src/application/schedule/validateAndConfirmSchedules.service';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';
import { FIND_SCHEDULE_BY_ID_REPOSITORY } from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import { VALIDATE_AND_CONFIRM_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IValidateSchedulesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';

describe('ValidateAndConfirmSchedulesService', () => {
  let service: ValidateAndConfirmSchedulesService;

  const mockValidateAndConfirmSchedulesRepository = {
    validate: jest.fn(),
    confirm: jest.fn(),
  };

  const mockStatusFlowRepository = {
    updateScheduleStatus: jest.fn(),
    updateStatusWorks: jest.fn(),
  };

  const mockFindScheduleByIdRepository = {
    findById: jest.fn(),
  };

  const mockPrisma = {
    $transaction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ValidateAndConfirmSchedulesService,
        {
          provide: VALIDATE_AND_CONFIRM_SCHEDULES_REPOSITORY,
          useValue: mockValidateAndConfirmSchedulesRepository,
        },
        { provide: STATUS_FLOW_REPOSITORY, useValue: mockStatusFlowRepository },
        {
          provide: FIND_SCHEDULE_BY_ID_REPOSITORY,
          useValue: mockFindScheduleByIdRepository,
        },
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<ValidateAndConfirmSchedulesService>(
      ValidateAndConfirmSchedulesService,
    );
  });

  afterEach(jest.clearAllMocks);

  describe('validate', () => {
    it('should throw BadRequestException when data is not sent or is an empty array', async () => {
      const expectedErrorMessage =
        'Nenhuma programação foi enviada para ser validada';

      await expect(service.validate([])).rejects.toThrow(
        new BadRequestException(expectedErrorMessage),
      );

      await expect(service.validate(undefined as any)).rejects.toThrow(
        new BadRequestException(expectedErrorMessage),
      );
    });

    it('should throw BadRequestException when not sent validate schedules', async () => {
      await expect(
        service.validate([{ id: 1, validate: false }]),
      ).rejects.toThrow(
        new BadRequestException('Existe programações não validadas'),
      );
    });

    it('should validate schedules and update work status successfully when no errors occur', async () => {
      const data = [
        {
          id: 1,
          validate: true,
        },
      ];

      mockFindScheduleByIdRepository.findById.mockResolvedValue({ id_obra: 2 });
      mockPrisma.$transaction.mockImplementation(async (cb) => cb({}));

      await service.validate(data);

      expect(
        mockValidateAndConfirmSchedulesRepository.validate,
      ).toHaveBeenCalledWith(data, expect.any(Object));
      expect(mockStatusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
        37,
        2,
        expect.any(Object),
      );
    });

    it('should throw InternalServerErrorException when transaction fails during schedule validation and status update', async () => {
      const error = new Error('Erro interno');
      const data = [
        {
          id: 1,
          validate: true,
        },
      ];

      mockValidateAndConfirmSchedulesRepository.validate.mockImplementation(
        () => {
          throw error;
        },
      );

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback({});
      });

      await expect(service.validate(data)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('confirm', () => {
    it('should throw BadRequestException when data is not sent or is an empty array', async () => {
      const expectedErrorMessage = 'Nenhuma programação para ser confirmada';

      await expect(service.confirm([])).rejects.toThrow(
        new BadRequestException(expectedErrorMessage),
      );

      await expect(service.confirm(undefined as any)).rejects.toThrow(
        new BadRequestException(expectedErrorMessage),
      );
    });

    it('should confirmed schedules and update work status successfully when no errors occur', async () => {
      const data = [
        {
          id: 1,
          confirm: true,
        },
      ];

      mockFindScheduleByIdRepository.findById.mockResolvedValue({ id_obra: 2 });
      mockPrisma.$transaction.mockImplementation(async (cb) => cb({}));

      await service.confirm(data);

      expect(
        mockValidateAndConfirmSchedulesRepository.confirm,
      ).toHaveBeenCalledWith(data, expect.any(Object));
      expect(mockStatusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
        35,
        2,
        expect.any(Object),
      );
    });

    it('should throw InternalServerErrorException when transaction fails during schedule confirmation and status update', async () => {
      const error = new Error('Erro interno');
      const data = [
        {
          id: 1,
          confirm: true,
        },
      ];

      mockValidateAndConfirmSchedulesRepository.confirm.mockImplementation(
        () => {
          throw error;
        },
      );

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback({});
      });

      await expect(service.confirm(data)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });
});
