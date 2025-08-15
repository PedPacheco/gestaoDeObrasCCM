import { HandleWorkUpdateService } from 'src/application/orchestrators/handleWorkUpdate.service';
import { GetWorkDetailsService } from 'src/application/works/getWorkDetails.service';
import { STATUS_FLOW_REPOSITORY } from 'src/domain/repositories/IStatusFlowRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { UpdateWorkDTO } from 'src/interface/dtos/worksDto';

import { Test, TestingModule } from '@nestjs/testing';
import { UpdateWorkService } from 'src/application/works/updateWork.service';
import { BadGatewayException, BadRequestException } from '@nestjs/common';

describe('HandleWorkUpdateService', () => {
  let service: HandleWorkUpdateService;

  const mockPrisma = {
    $transaction: jest.fn(),
  };

  const mockUpdateWorkService = {
    update: jest.fn(),
  };

  const mockStatusFlowRepository = {
    updateStatusWorks: jest.fn(),
    updateScheduleStatus: jest.fn(),
  };

  const mockGetDetailsService = {
    get: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HandleWorkUpdateService,
        { provide: PrismaService, useValue: mockPrisma },
        {
          provide: UpdateWorkService,
          useValue: mockUpdateWorkService,
        },
        {
          provide: STATUS_FLOW_REPOSITORY,
          useValue: mockStatusFlowRepository,
        },
        { provide: GetWorkDetailsService, useValue: mockGetDetailsService },
      ],
    }).compile();

    service = module.get<HandleWorkUpdateService>(HandleWorkUpdateService);
  });

  afterEach(jest.clearAllMocks);

  describe('add', () => {
    it('should add schedule and update work status within a transaction', async () => {
      const data: UpdateWorkDTO = {
        id_status: 2,
        id_turma: 4,
        tipo_ads: 'Convencional',
        data_empreitamento: new Date('2025-06-09T00:00:00.000Z'),
      };

      mockGetDetailsService.get.mockResolvedValue({ id_status: 42, id: 1 });

      mockPrisma.$transaction.mockImplementation(async (cb) => cb({}));

      await service.update(data, 1, false);

      expect(mockUpdateWorkService.update).toHaveBeenCalledWith(
        data,
        1,
        expect.any(Object),
      );
      expect(mockStatusFlowRepository.updateStatusWorks).toHaveBeenCalledWith(
        1,
        1,
        expect.any(Object),
      );
    });

    it('should throw BadRequestException when work status is restricted and user has permission flag set', async () => {
      const data: UpdateWorkDTO = {
        id_status: 42,
        id_turma: 4,
        tipo_ads: null,
        data_empreitamento: null,
      };

      mockGetDetailsService.get.mockResolvedValue({ id_status: 42, id: 1 });

      mockUpdateWorkService.update.mockResolvedValue({});

      await expect(service.update(data, 1, true)).rejects.toThrow(
        new BadRequestException(
          'Usuário não tem permissão para atualizar essa obra',
        ),
      );

      expect(mockUpdateWorkService.update).not.toHaveBeenCalled();
    });

    it('should throw BadGatwayException when work not found', async () => {
      const data: UpdateWorkDTO = {
        id_status: 42,
        id_turma: 4,
        tipo_ads: 'Convencional',
        data_empreitamento: new Date('2025-06-09T00:00:00.000Z'),
      };

      mockGetDetailsService.get.mockResolvedValue({});

      mockUpdateWorkService.update.mockResolvedValue({});

      await expect(service.update(data, 1, false)).rejects.toThrow(
        new BadGatewayException('Obra não foi encontrada'),
      );

      expect(mockUpdateWorkService.update).not.toHaveBeenCalled();
    });
  });
});
