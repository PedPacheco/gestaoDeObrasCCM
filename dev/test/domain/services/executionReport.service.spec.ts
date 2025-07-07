import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { EXECUTION_REPORT_REPOSITORY } from 'src/domain/repositories/IExecutionReportRepository';
import { ExecutionReportService } from 'src/domain/services/executionReport.service';
import {
  mockExecutionReportPersistenceObject,
  mockExecutionReportRepository,
  mockExecutionReportService,
  mockExecutionReportServiceWithErrorEquipmentInstalled,
  mockExecutionReportServiceWithErrorEquipmentRemoved,
  mockExecutionReportServiceWithErrorProvisionalKeyReference,
  mockFindByWorkIdResponse,
  mockUpdateExecutionReportDTO,
} from '../../../test/mocks/mocksExecutionReport';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { FIND_SCHEDULE_BY_ID_REPOSITORY } from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import * as ExecutionReportEntity from 'src/domain/entities/executionReport.entity';

describe('ExecutionReportService', () => {
  let service: ExecutionReportService;

  const mockRepository = {
    create: jest.fn(),
    update: jest.fn(),
    findByScheduleId: jest.fn(),
    findByWorkId: jest.fn(),
    findById: jest.fn(),
  };

  const mockFindScheduleRepository = {
    findById: jest.fn(),
  };

  const mockTransaction = {
    programacoes: {
      update: jest.fn(),
    },
  } as unknown as Prisma.TransactionClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionReportService,
        { provide: EXECUTION_REPORT_REPOSITORY, useValue: mockRepository },
        {
          provide: FIND_SCHEDULE_BY_ID_REPOSITORY,
          useValue: mockFindScheduleRepository,
        },
      ],
    }).compile();

    service = module.get<ExecutionReportService>(ExecutionReportService);
  });

  afterEach(jest.clearAllMocks);

  describe('create', () => {
    it('Should call method create and return void if schedule exists', async () => {
      mockRepository.findByScheduleId.mockResolvedValue(true);

      const result = await service.create(
        mockExecutionReportService,
        new Date('17-05-2025'),
        mockTransaction,
      );

      expect(result).toBeUndefined();
      expect(mockRepository.create).not.toHaveBeenCalled();
    });

    it('Should call method create and call method create of repository sent data and transaction', async () => {
      mockRepository.findByScheduleId.mockResolvedValue(false);

      const result = await service.create(
        mockExecutionReportService,
        new Date('17-05-2025'),
        mockTransaction,
      );

      expect(result).toBeUndefined();
      expect(mockRepository.create).toHaveBeenCalledWith(
        mockExecutionReportRepository,
        mockTransaction,
      );
    });

    it('Should call method create and throw BadRequestExpection if equipmet installed no sent', async () => {
      await expect(
        service.create(
          mockExecutionReportServiceWithErrorEquipmentInstalled,
          new Date('17-05-2025'),
          mockTransaction,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('Should call method create and throw BadRequestExpection if equipmet removed no sent', async () => {
      await expect(
        service.create(
          mockExecutionReportServiceWithErrorEquipmentRemoved,
          new Date('17-05-2025'),
          mockTransaction,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('Should call method create and throw BadRequestExpection if provisional Key Reference no sent', async () => {
      await expect(
        service.create(
          mockExecutionReportServiceWithErrorProvisionalKeyReference,
          new Date('17-05-2025'),
          mockTransaction,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findByWorkId', () => {
    it('Should call method findByWorkId and return formatted data', async () => {
      mockRepository.findByWorkId.mockResolvedValue(mockFindByWorkIdResponse);

      const result = await service.findByWorkId(1);

      expect(mockRepository.findByWorkId).toHaveBeenCalledWith(1);
      expect(result).toEqual([
        {
          nome_usuario: 'Carlos Oliveira',
          ovnota: '16004316',
          ordem_dci: '170000023493',
          tipo_obra: 'Manutenção',
          data_exec: new Date('2025-06-24T08:30:00.000Z'),
          prog: 100,
          exec: 50,
          status: 'EM EMPREITAMENTO',
          num_dp: 2135,
          hora_ini: new Date('2025-06-24T08:30:00.000Z'),
          hora_ter: new Date('2025-06-24T12:30:00.000Z'),
          chave_provisoria: true,
          supervisor: 'João Silva',
          liberado_ligacao_parcial: true,
          hora_inicio: new Date('2025-06-24T08:30:00.000Z'),
          hora_conclusao: new Date('2025-06-24T12:45:00.000Z'),
          contato_inicio: 'Contato iniciado com responsável local.',
          contato_termino: 'Contato encerrado com responsável local.',
          atraso: true,
          justificativa_atraso: 'Trânsito intenso na região.',
          possui_equipamentos_instalados: true,
          equipamentos_aplicados: 'Transformador, Relé de proteção',
          potencia_equipamento_aplicado: '50, 30',
          patrimonio_equipamento_aplicado: '123456789, 987654321',
          equipamentos_retirados: '',
          potencia_equipamento_retirado: '',
          patrimonio_equipamento_retirado: '',
          alteracoes_execucao: false,
          observacoes_gerais:
            'Execução dentro do esperado, sem intercorrências.',
          chave_provisoria_instalada: true,
          referencia_chave_provisoria: 'CHV123456',
          chave_provisoria_retirada: false,
          motivo: 'Instalação programada',
        },
      ]);
    });

    it('Should call method findByWorkId and throw BadRequestExpection if id no sent', async () => {
      await expect(service.findByWorkId(null)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('update', () => {
    it('should call method update with no data content and throw a NotFoundException', async () => {
      await expect(service.update(1, null)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should call method update and if execution report not exist, throw a NotFoundException', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(
        service.update(1, mockUpdateExecutionReportDTO),
      ).rejects.toThrow(NotFoundException);
    });

    it('should call method update and if schedule not exist, throw a NotFoundException', async () => {
      mockRepository.findById.mockResolvedValue({ idSchedule: 1, idWork: 2 });
      mockFindScheduleRepository.findById.mockResolvedValue(null);

      await expect(
        service.update(1, mockUpdateExecutionReportDTO),
      ).rejects.toThrow(NotFoundException);
    });

    it('should call method update and should create a execution report entity and sent to update method repository', async () => {
      mockRepository.findById.mockResolvedValue({ idSchedule: 1, idWork: 2 });
      mockFindScheduleRepository.findById.mockResolvedValue({
        hora_ter: new Date('17-05-2025'),
      });

      await service.update(1, mockUpdateExecutionReportDTO);

      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        mockExecutionReportPersistenceObject,
      );
    });

    it('should throw BadRequestException with correct message if ExecutionReport.create fails', async () => {
      mockRepository.findById.mockResolvedValue({ idSchedule: 1, idWork: 2 });
      mockFindScheduleRepository.findById.mockResolvedValue({
        hora_ter: new Date('2025-05-17'), // data corrigida para formato válido
      });

      jest
        .spyOn(ExecutionReportEntity.ExecutionReport, 'create')
        .mockImplementationOnce(() => {
          throw new Error('Erro forçado no create');
        });

      const result = service.update(1, mockUpdateExecutionReportDTO);

      await expect(result).rejects.toThrow(BadRequestException);
      await expect(result).rejects.toThrow(
        'Erro ao criar relatório: Erro forçado no create',
      );
    });
  });
});
