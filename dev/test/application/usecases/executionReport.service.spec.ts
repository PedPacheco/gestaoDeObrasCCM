import { ExecutionReportService } from 'src/application/usecases/executionReport.service';
import { FileService } from 'src/application/usecases/file.service';
import * as ExecutionReportEntity from 'src/domain/entities/executionReport.entity';
import { EXECUTION_REPORT_REPOSITORY } from 'src/domain/repositories/IExecutionReportRepository';
import { FIND_SCHEDULE_BY_ID_REPOSITORY } from 'src/domain/repositories/schedule/IFindScheduleByIdRepository';
import { Readable } from 'stream';

import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from 'src/infra/generated/prisma/client';

import { ProgressRecalculationService } from 'src/application/usecases/services/progressRecalculation.service';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import {
  ScheduleStatus,
  WorkStatus,
} from 'src/utils/pointByPoint/serviceType.utils';
import {
  mockExecutionReportPersistenceObject,
  mockExecutionReportRepository,
  mockExecutionReportService,
  mockExecutionReportServiceWithErrorEquipmentInstalled,
  mockExecutionReportServiceWithErrorEquipmentRemoved,
  mockExecutionReportServiceWithErrorProvisionalKeyReference,
  mockExecutionReportServiceWithErrorProvisionalKeyReferenceWithdrawn,
  mockFindByWorkIdResponse,
  mockUpdateExecutionReportDTO,
} from '../../mocks/mocksExecutionReport';

describe('ExecutionReportService', () => {
  let service: ExecutionReportService;

  const mockRepository = {
    create: vi.fn(),
    update: vi.fn(),
    findByScheduleId: vi.fn(),
    findByWorkId: vi.fn(),
    findById: vi.fn(),
    findScheduleWorkMode: vi.fn(),
    findScheduledServiceIds: vi.fn(),
    resetScheduleExecution: vi.fn(),
    clearServicesReal: vi.fn(),
    sumWorkSchedulesExec: vi.fn(),
    updateWorkStatusAfterReset: vi.fn(),
    deleteReport: vi.fn(),
  };

  const mockFindScheduleRepository = {
    findById: vi.fn(),
  };

  const mockProgressCalculationService = {
    recomputeAll: vi.fn(),
  };

  const mockFileService = {
    deleteFile: vi.fn(),
  };

  const mockExistsFiles: Express.Multer.File[] = [
    {
      fieldname: 'files',
      originalname: 'teste.pdf',
      encoding: '7bit',
      mimetype: 'application/pdf',
      size: 1024,
      destination: '/tmp',
      filename: 'teste.pdf',
      path: '/tmp/teste.pdf',
      buffer: Buffer.from('fake file content'),
      stream: Readable.from(['fake file content']),
    },
  ];

  const mockFiles: Express.Multer.File[] = [];

  const mockTransaction = {
    programacoes: {
      update: vi.fn(),
    },
  } as unknown as Prisma.TransactionClient;

  const mockPrismaService = {
    $transaction: vi.fn(
      (cb: (tx: Prisma.TransactionClient) => Promise<unknown>) =>
        cb(mockTransaction),
    ),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ExecutionReportService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: EXECUTION_REPORT_REPOSITORY, useValue: mockRepository },
        {
          provide: FIND_SCHEDULE_BY_ID_REPOSITORY,
          useValue: mockFindScheduleRepository,
        },
        {
          provide: ProgressRecalculationService,
          useValue: mockProgressCalculationService,
        },
        { provide: FileService, useValue: mockFileService },
      ],
    }).compile();

    service = module.get<ExecutionReportService>(ExecutionReportService);
  });

  afterEach(vi.clearAllMocks);

  describe('create', () => {
    it('Should call method create and return void if schedule exists', async () => {
      mockRepository.findByScheduleId.mockResolvedValue(true);

      const result = await service.create(
        mockExecutionReportService,
        new Date('17-05-2025'),
        mockFiles,
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
        mockExistsFiles,
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
          mockFiles,
          mockTransaction,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('Should call method create and throw BadRequestExpection if provisionalKeyWithdrawn equal true and provisionalKeyReferenceWithdrawn no sent', async () => {
      await expect(
        service.create(
          mockExecutionReportServiceWithErrorProvisionalKeyReferenceWithdrawn,
          new Date('17-05-2025'),
          mockFiles,
          mockTransaction,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('Should call method create and throw BadRequestExpection if equipmet removed no sent', async () => {
      await expect(
        service.create(
          mockExecutionReportServiceWithErrorEquipmentRemoved,
          new Date('17-05-2025'),
          mockExistsFiles,
          mockTransaction,
        ),
      ).rejects.toThrow(BadRequestException);

      expect(mockFileService.deleteFile).toHaveBeenCalled();
    });

    it('should throw BadRequestException if files not sent', async () => {
      await expect(
        service.create(
          mockExecutionReportServiceWithErrorEquipmentRemoved,
          new Date('17-05-2025'),
          undefined,
          mockTransaction,
        ),
      ).rejects.toThrow(BadRequestException);
    });

    it('Should call method create and throw BadRequestExpection if provisional Key Reference no sent', async () => {
      await expect(
        service.create(
          mockExecutionReportServiceWithErrorProvisionalKeyReference,
          new Date('17-05-2025'),
          mockFiles,
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
          id: 1,
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
          obras: undefined,
          usuario: undefined,
          programacoes: undefined,
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

    it('should throw BadRequestException with correct message if ExecutionReport.create fails with files sent', async () => {
      mockRepository.findById.mockResolvedValue({ idSchedule: 1, idWork: 2 });
      mockFindScheduleRepository.findById.mockResolvedValue({
        hora_ter: new Date('2025-05-17'), // data corrigida para formato válido
      });

      vi.spyOn(
        ExecutionReportEntity.ExecutionReport,
        'create',
      ).mockImplementationOnce(() => {
        throw new Error('Erro forçado no create');
      });

      const result = service.update(
        1,
        mockUpdateExecutionReportDTO,
        mockExistsFiles,
      );

      await expect(result).rejects.toThrow(BadRequestException);
      await expect(result).rejects.toThrow(
        'Erro ao criar relatório: Erro forçado no create',
      );
      expect(mockFileService.deleteFile).toHaveBeenCalled();
    });

    it('should throw BadRequestException with correct message if ExecutionReport.create fails with files not sent', async () => {
      mockRepository.findById.mockResolvedValue({ idSchedule: 1, idWork: 2 });
      mockFindScheduleRepository.findById.mockResolvedValue({
        hora_ter: new Date('2025-05-17'), // data corrigida para formato válido
      });

      vi.spyOn(
        ExecutionReportEntity.ExecutionReport,
        'create',
      ).mockImplementationOnce(() => {
        throw new Error('Erro forçado no create');
      });

      const result = service.update(1, mockUpdateExecutionReportDTO);

      await expect(result).rejects.toThrow(BadRequestException);
      await expect(result).rejects.toThrow(
        'Erro ao criar relatório: Erro forçado no create',
      );
      expect(mockFileService.deleteFile).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException with correct message if ExecutionReport.create fails with files not sent', async () => {
      mockRepository.findById.mockResolvedValue({
        idSchedule: 1,
        idWork: 2,
        caminho_arquivo: 'teste.pdf',
      });
      mockFindScheduleRepository.findById.mockResolvedValue({
        hora_ter: new Date('2025-05-17'), // data corrigida para formato válido
      });

      const result = service.update(
        1,
        { ...mockUpdateExecutionReportDTO, endContact: null },
        mockExistsFiles,
      );

      await expect(result).rejects.toThrow(BadRequestException);
      await expect(result).rejects.toThrow(
        'Arquivos só podem ser enviados quando o relatório de execução estiver completo',
      );
      expect(mockFileService.deleteFile).toHaveBeenCalled();
    });

    it('should call method update and should create a execution report entity and sent to update method repository', async () => {
      mockRepository.findById.mockResolvedValue({
        id_programacao: 1,
        id_obra: 2,
        caminho_arquivo: '4353.pdf',
      });
      mockFindScheduleRepository.findById.mockResolvedValue({
        hora_ter: new Date('17-05-2025'),
      });

      await service.update(
        1,
        { ...mockUpdateExecutionReportDTO, userId: 1 },
        mockExistsFiles,
      );

      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        mockExecutionReportPersistenceObject,
      );
      expect(mockFileService.deleteFile).toHaveBeenCalled();
    });

    it('should call method update and should create a execution report entity and sent to update method repository', async () => {
      mockRepository.findById.mockResolvedValue({
        id_programacao: 1,
        id_obra: 2,
      });
      mockFindScheduleRepository.findById.mockResolvedValue({
        hora_ter: new Date('17-05-2025'),
      });

      await service.update(
        1,
        { ...mockUpdateExecutionReportDTO, userId: 1 },
        mockExistsFiles,
      );

      expect(mockRepository.update).toHaveBeenCalledWith(
        1,
        mockExecutionReportPersistenceObject,
      );
      expect(mockFileService.deleteFile).not.toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    const REPORT_ID = 1;
    const SCHEDULE_ID = 3;
    const WORK_ID = 10;
    const SERVICE_IDS = [100, 101];
    const UPLOAD_DIR = '/uploads/asbuild';
    const originalUploadDir = process.env.UPLOAD_AS_BUILD;

    const mockReport = {
      id: REPORT_ID,
      id_programacao: SCHEDULE_ID,
      caminho_arquivo: 'teste1.pdf;teste2.pdf',
    };

    const buildSchedule = (pontoAPonto: boolean) => ({
      id_obra: WORK_ID,
      obras: { programacao_ponto_a_ponto: pontoAPonto },
    });

    beforeAll(() => {
      process.env.UPLOAD_AS_BUILD = UPLOAD_DIR;
    });

    afterAll(() => {
      process.env.UPLOAD_AS_BUILD = originalUploadDir;
    });

    beforeEach(() => {
      // valores por omissão: cenário feliz, fluxo normal
      mockRepository.findById.mockResolvedValue(mockReport);
      mockRepository.findScheduleWorkMode.mockResolvedValue(
        buildSchedule(false),
      );
      mockRepository.findScheduledServiceIds.mockResolvedValue(SERVICE_IDS);
      mockRepository.sumWorkSchedulesExec.mockResolvedValue(42);
    });

    // ─── Validações ──────────────────────────────────────────────────

    it('should throw BadRequestException if id is not sent', async () => {
      await expect(service.delete(null)).rejects.toThrow(BadRequestException);

      expect(mockRepository.findById).not.toHaveBeenCalled();
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    it('should throw NotFoundException if report is not found', async () => {
      mockRepository.findById.mockResolvedValue(null);

      await expect(service.delete(REPORT_ID)).rejects.toThrow(
        NotFoundException,
      );

      expect(mockFileService.deleteFile).not.toHaveBeenCalled();
      expect(mockPrismaService.$transaction).not.toHaveBeenCalled();
    });

    // ─── Ficheiros ───────────────────────────────────────────────────

    it('should delete every file listed in caminho_arquivo', async () => {
      await service.delete(REPORT_ID);

      expect(mockFileService.deleteFile).toHaveBeenCalledTimes(2);
      expect(mockFileService.deleteFile).toHaveBeenNthCalledWith(
        1,
        `${UPLOAD_DIR}/teste1.pdf`,
      );
      expect(mockFileService.deleteFile).toHaveBeenNthCalledWith(
        2,
        `${UPLOAD_DIR}/teste2.pdf`,
      );
    });

    // ─── Transação ───────────────────────────────────────────────────

    it('should run the reset inside a prisma transaction', async () => {
      await service.delete(REPORT_ID);

      expect(mockPrismaService.$transaction).toHaveBeenCalledTimes(1);
      expect(mockRepository.findScheduleWorkMode).toHaveBeenCalledWith(
        SCHEDULE_ID,
        mockTransaction,
      );
      expect(mockRepository.findScheduledServiceIds).toHaveBeenCalledWith(
        SCHEDULE_ID,
        mockTransaction,
      );
      expect(mockRepository.resetScheduleExecution).toHaveBeenCalledWith(
        SCHEDULE_ID,
        ScheduleStatus.CONFIRMADA,
        mockTransaction,
      );
      expect(mockRepository.deleteReport).toHaveBeenCalledWith(
        REPORT_ID,
        mockTransaction,
      );
    });

    it('should throw NotFoundException if schedule is not found and not delete the report', async () => {
      mockRepository.findScheduleWorkMode.mockResolvedValue(null);

      await expect(service.delete(REPORT_ID)).rejects.toThrow(
        new NotFoundException(
          `Programação com ID ${SCHEDULE_ID} não encontrada`,
        ),
      );

      expect(mockRepository.resetScheduleExecution).not.toHaveBeenCalled();
      expect(mockRepository.updateWorkStatusAfterReset).not.toHaveBeenCalled();
      expect(mockRepository.deleteReport).not.toHaveBeenCalled();
    });

    it('should delete the report only after resetting the execution', async () => {
      await service.delete(REPORT_ID);

      const resetOrder =
        mockRepository.resetScheduleExecution.mock.invocationCallOrder[0];
      const updateOrder =
        mockRepository.updateWorkStatusAfterReset.mock.invocationCallOrder[0];
      const deleteOrder =
        mockRepository.deleteReport.mock.invocationCallOrder[0];

      expect(resetOrder).toBeLessThan(deleteOrder);
      expect(updateOrder).toBeLessThan(deleteOrder);
    });

    // ─── Fluxo ponto a ponto ─────────────────────────────────────────

    describe('when work is ponto a ponto', () => {
      beforeEach(() => {
        mockRepository.findScheduleWorkMode.mockResolvedValue(
          buildSchedule(true),
        );
      });

      it('should recompute progress and set work status to CONFIRMADA without executed', async () => {
        await service.delete(REPORT_ID);

        expect(
          mockProgressCalculationService.recomputeAll,
        ).toHaveBeenCalledWith(SERVICE_IDS, WORK_ID, mockTransaction);
        expect(mockRepository.updateWorkStatusAfterReset).toHaveBeenCalledWith(
          WORK_ID,
          { status: WorkStatus.CONFIRMADA },
          mockTransaction,
        );
        expect(mockRepository.clearServicesReal).not.toHaveBeenCalled();
        expect(mockRepository.sumWorkSchedulesExec).not.toHaveBeenCalled();
        expect(mockRepository.deleteReport).toHaveBeenCalledWith(
          REPORT_ID,
          mockTransaction,
        );
      });

      it('should propagate error from recomputeAll and not delete the report', async () => {
        mockProgressCalculationService.recomputeAll.mockRejectedValueOnce(
          new Error('recompute failed'),
        );

        await expect(service.delete(REPORT_ID)).rejects.toThrow(
          'recompute failed',
        );

        expect(
          mockRepository.updateWorkStatusAfterReset,
        ).not.toHaveBeenCalled();
        expect(mockRepository.deleteReport).not.toHaveBeenCalled();
      });
    });

    // ─── Fluxo normal ────────────────────────────────────────────────

    describe('when work is NOT ponto a ponto', () => {
      it('should clear services real, sum executed and update work status', async () => {
        await service.delete(REPORT_ID);

        expect(mockRepository.clearServicesReal).toHaveBeenCalledWith(
          SERVICE_IDS,
          mockTransaction,
        );
        expect(mockRepository.sumWorkSchedulesExec).toHaveBeenCalledWith(
          WORK_ID,
          mockTransaction,
        );
        expect(mockRepository.updateWorkStatusAfterReset).toHaveBeenCalledWith(
          WORK_ID,
          { status: WorkStatus.CONFIRMADA, executed: 42 },
          mockTransaction,
        );
        expect(
          mockProgressCalculationService.recomputeAll,
        ).not.toHaveBeenCalled();
        expect(mockRepository.deleteReport).toHaveBeenCalledWith(
          REPORT_ID,
          mockTransaction,
        );
      });

      it('should follow the normal flow when schedule has no obras relation', async () => {
        mockRepository.findScheduleWorkMode.mockResolvedValue({
          id_obra: WORK_ID,
          obras: null,
        });

        await service.delete(REPORT_ID);

        expect(mockRepository.clearServicesReal).toHaveBeenCalled();
        expect(
          mockProgressCalculationService.recomputeAll,
        ).not.toHaveBeenCalled();
      });
    });
  });
});
