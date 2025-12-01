import { afterEach } from 'node:test';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { RejectionsOfSchedulesRepository } from 'src/infra/repositories/schedule/rejectionsOfSchedulesRepository';

import { Test } from '@nestjs/testing';

describe('RejectionsOfSchedulesRepository', () => {
  let repository: RejectionsOfSchedulesRepository;

  const mockPrisma = {
    programacoes_reprovacoes: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        RejectionsOfSchedulesRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<RejectionsOfSchedulesRepository>(
      RejectionsOfSchedulesRepository,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Get', () => {
    it('should call findMany method of programacoes_reprovacoes table and return data', async () => {
      mockPrisma.programacoes_reprovacoes.findMany.mockResolvedValue([
        {
          motivo: 'CHI',
          data_prog: new Date('2025-05-17'),
          hora_ini: '08:00',
          hora_ter: '17:00',
          prog: 80,
          descricao: 'Obra sem chi',
          equip_desligado: 'transformador',
          equipe_linha_morta: 6,
          equipe_linha_viva: 0,
          equipe_regularizacao: 0,
          tipo_servico: 'DP',
          observacao_programacao: null,
        },
      ]);

      const idWork = 1;

      const result = await repository.get(idWork);

      expect(result).toEqual([
        {
          motivo: 'CHI',
          data_prog: new Date('2025-05-17'),
          hora_ini: '08:00',
          hora_ter: '17:00',
          prog: 80,
          descricao: 'Obra sem chi',
          equip_desligado: 'transformador',
          equipe_linha_morta: 6,
          equipe_linha_viva: 0,
          equipe_regularizacao: 0,
          tipo_servico: 'DP',
          observacao_programacao: null,
        },
      ]);

      expect(mockPrisma.programacoes_reprovacoes.findMany).toHaveBeenCalledWith(
        {
          where: {
            obras: {
              OR: [
                { id: 1 },
                { ovnota: '1' },
                { ordem_dci: '1' },
                { ordem_dcd: '1' },
                { ordem_dca: '1' },
                { ordem_dcim: '1' },
                { diagrama: '1' },
              ],
            },
          },
          select: {
            motivo: true,
            data_prog: true,
            hora_ini: true,
            hora_ter: true,
            prog: true,
            descricao: true,
            equip_desligado: true,
            equipe_linha_morta: true,
            equipe_linha_viva: true,
            equipe_regularizacao: true,
            tipo_servico: true,
            observacao_programacao: true,
          },
        },
      );
    });
  });
});
