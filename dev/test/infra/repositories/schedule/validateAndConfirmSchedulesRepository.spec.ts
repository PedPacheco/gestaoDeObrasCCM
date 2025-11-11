import { Test, TestingModule } from '@nestjs/testing';
import { Prisma } from '@prisma/client';
import { ValidateAndConfirmSchedulesRepository } from 'src/infra/repositories/schedule/validateAndConfirmSchedulesRepository';

describe('ValidateAndConfirmSchedulesRepository', () => {
  let repository: ValidateAndConfirmSchedulesRepository;

  const mockTransaction = {
    programacoes: {
      updateMany: jest.fn(),
      update: jest.fn(),
    },
    programacoes_reprovacoes: {
      create: jest.fn(),
    },
  } as unknown as Prisma.TransactionClient;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ValidateAndConfirmSchedulesRepository],
    }).compile();

    repository = module.get<ValidateAndConfirmSchedulesRepository>(
      ValidateAndConfirmSchedulesRepository,
    );
  });

  afterEach(jest.clearAllMocks);

  describe('validate', () => {
    it('Should call method validate and correctly update the schedules that have been validated', async () => {
      const data = [
        {
          id: 1,
          validate: true,
        },
        {
          id: 2,
          validate: true,
        },
      ];

      await repository.validate(data, mockTransaction);

      expect(mockTransaction.programacoes.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: [1, 2],
          },
        },
        data: {
          id_status_programacao: 2,
          validada: true,
        },
      });
    });
  });

  describe('confirm', () => {
    it('Should call method confirm and correctly update the schedules that have been confirmed', async () => {
      const data = [
        {
          id: 1,
          confirm: true,
        },
        {
          id: 2,
          confirm: true,
        },
      ];

      await repository.confirm(data, mockTransaction);

      expect(mockTransaction.programacoes.updateMany).toHaveBeenCalledWith({
        where: {
          id: {
            in: [1, 2],
          },
        },
        data: {
          id_status_programacao: 3,
          confirmada: true,
        },
      });
    });
  });

  describe('reject', () => {
    it('Should call method confirm and correctly update the schedules that have been confirmed', async () => {
      const data = {
        id: 1,
        reject: true,
        reason: '',
        description: '',
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

      await repository.reject(data, mockTransaction);

      expect(
        mockTransaction.programacoes_reprovacoes.create,
      ).toHaveBeenCalledWith({
        data: {
          id_obra: data.id_obra,
          motivo: data.reason,
          descricao: data.description,
          data_prog: data.data_prog,
          prog: data.prog,
          equip_desligado: data.equip_desligado,
          hora_ini: data.hora_ini,
          hora_ter: data.hora_ter,
          equipe_linha_viva: data.equipe_linha_viva,
          equipe_linha_morta: data.equipe_linha_morta,
          equipe_regularizacao: data.equipe_regularizacao,
          tipo_servico: data.tipo_servico,
          observacao_programacao: data.observacao_programacao,
        },
      });
      expect(mockTransaction.programacoes.update).toHaveBeenCalledWith({
        where: { id: data.id },
        data: {
          reprovada: data.reject,
          id_status_programacao: 7,
        },
      });
    });

    it('should return error when prisma error occurs', async () => {
      const data = {
        id: 1,
        reject: true,
        reason: '',
        description: '',
      };

      const error = new Error('DB connection failed');

      (
        mockTransaction.programacoes_reprovacoes.create as jest.Mock
      ).mockRejectedValue(error);

      await expect(repository.reject(data, mockTransaction)).rejects.toThrow(
        'DB connection failed',
      );
    });
  });
});
