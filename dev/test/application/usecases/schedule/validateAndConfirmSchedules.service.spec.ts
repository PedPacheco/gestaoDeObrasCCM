import { ValidateConfirmAndRejectSchedulesService } from 'src/application/usecases/schedule/validateAndConfirmSchedules.service';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';
import { FIND_SCHEDULE_BY_ID_REPOSITORY } from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import { VALIDATE_CONFIRM_AND_REJECT_SCHEDULES_REPOSITORY } from 'src/domain/repositories/schedule/IValidateSchedulesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { mockResponseFindScheduleByIdRepository } from '../../../../test/mocks/mockAddScheduleService';

import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('ValidateAndConfirmSchedulesService', () => {
  let service: ValidateConfirmAndRejectSchedulesService;

  const mockValidateAndConfirmSchedulesRepository = {
    validate: jest.fn(),
    confirm: jest.fn(),
    reject: jest.fn(),
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
        ValidateConfirmAndRejectSchedulesService,
        {
          provide: VALIDATE_CONFIRM_AND_REJECT_SCHEDULES_REPOSITORY,
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

    service = module.get<ValidateConfirmAndRejectSchedulesService>(
      ValidateConfirmAndRejectSchedulesService,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

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
      const data = [
        {
          id: 1,
          confirm: false,
        },
      ];

      const expectedErrorMessage = 'Nenhuma programação para ser confirmada';

      await expect(service.confirm(data)).rejects.toThrow(
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

      mockFindScheduleByIdRepository.findById.mockResolvedValue(
        mockResponseFindScheduleByIdRepository,
      );

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

    it('should throw InternalServerErrorException when fail in create Schedule Entity', async () => {
      const data = [
        {
          id: 1,
          confirm: true,
        },
      ];

      mockFindScheduleByIdRepository.findById.mockResolvedValue({
        ...mockResponseFindScheduleByIdRepository,
        hora_ini: null,
      });

      mockPrisma.$transaction.mockImplementation(async (cb) => cb({}));

      await expect(service.confirm(data)).rejects.toThrow(BadRequestException);
    });

    it('should throw InternalServerErrorException when transaction fails during schedule confirmation and status update', async () => {
      const error = new Error('Erro interno');
      const data = [
        {
          id: 1,
          confirm: true,
        },
      ];

      mockFindScheduleByIdRepository.findById.mockResolvedValue(
        mockResponseFindScheduleByIdRepository,
      );

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

    it('should throw BadRequestException when serviceType num_dp is invalid', async () => {
      const data = [
        {
          id: 1,
          confirm: true,
        },
      ];

      mockFindScheduleByIdRepository.findById.mockResolvedValue({
        ...mockResponseFindScheduleByIdRepository,
        tipo_servico: 'DP',
        num_dp: '123', // inválido (menos de 8 dígitos)
      });

      mockPrisma.$transaction.mockImplementation(async (cb) => cb({}));

      await expect(service.confirm(data)).rejects.toThrow(
        new BadRequestException(
          'Número do DP deve conter exatamente 8 dígitos',
        ),
      );
    });

    it('should throw BadRequestException when serviceType requires DP ', async () => {
      const data = [
        {
          id: 1,
          confirm: true,
        },
      ];

      mockFindScheduleByIdRepository.findById.mockResolvedValue({
        ...mockResponseFindScheduleByIdRepository,
        tipo_servico: 'DP',
        num_dp: null,
      });

      mockPrisma.$transaction.mockImplementation(async (cb) => cb({}));

      await expect(service.confirm(data)).rejects.toThrow(
        new BadRequestException('Falta inserir número do DP'),
      );
    });

    it('should confirm successfully when serviceType requires DP and num_dp is valid', async () => {
      const data = [
        {
          id: 1,
          confirm: true,
        },
      ];

      mockFindScheduleByIdRepository.findById.mockResolvedValue({
        ...mockResponseFindScheduleByIdRepository,
        tipo_servico: 'DP',
        num_dp: '12345678',
      });

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
  });

  describe('reject', () => {
    it('should reject schedule and update work status when no erros occur', async () => {
      const data = [
        {
          id: 1,
          reject: true,
          reason: '',
          description: '',
        },
      ];

      const mockResponse = {
        id_obra: 2,
        data_prog: new Date('17/05/2025'),
        prog: 100,
        equip_desligado: '',
        hora_ini: '15:00',
        hora_ter: '17:00',
        equipe_linha_viva: 1,
        equipe_linha_morta: 2,
        equipe_regularizacao: 3,
        tipo_servico: 'DP',
        observacao_programacao: '',
      };

      mockFindScheduleByIdRepository.findById.mockResolvedValue(mockResponse);
      mockPrisma.$transaction.mockImplementation(async (cb) => cb({}));

      await service.reject(data);

      expect(
        mockValidateAndConfirmSchedulesRepository.reject,
      ).toHaveBeenCalledWith(
        { ...data[0], ...mockResponse },
        expect.any(Object),
      );
      expect(mockStatusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
        36,
        2,
        expect.any(Object),
      );
    });

    it('should throw error when transaction fails during schedule confirmation and status update', async () => {
      const error = new Error('Erro interno');
      const data = [
        {
          id: 1,
          id_obra: 1,
          reject: true,
          reason: '',
          description: '',
        },
      ];

      const mockResponse = {
        id_obra: 2,
        data_prog: new Date('17/05/2025'),
        prog: 100,
        equip_desligado: '',
        hora_ini: '15:00',
        hora_ter: '17:00',
        equipe_linha_viva: 1,
        equipe_linha_morta: 2,
        equipe_regularizacao: 3,
        tipo_servico: 'DP',
        observacao_programacao: '',
      };

      mockFindScheduleByIdRepository.findById.mockResolvedValue(mockResponse);

      mockValidateAndConfirmSchedulesRepository.reject.mockImplementation(
        () => {
          throw error;
        },
      );

      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return await callback({});
      });

      await expect(service.reject(data)).rejects.toThrow(error);
    });

    it('should return when data not sent', async () => {
      await service.reject([]);

      expect(mockFindScheduleByIdRepository.findById).not.toHaveBeenCalled();
      expect(
        mockValidateAndConfirmSchedulesRepository.reject,
      ).not.toHaveBeenCalled();
      expect(mockStatusFlowRepository.updateStatusWorks).not.toHaveBeenCalled();
    });
  });
});
