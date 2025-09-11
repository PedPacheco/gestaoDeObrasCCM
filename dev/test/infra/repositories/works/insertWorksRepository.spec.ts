import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { InsertWorksRepository } from 'src/infra/repositories/works/InsertWorksRepository';
import {
  mockGetAuxiliaryBaseMarket,
  mockGetAuxiliaryBaseMarket2,
} from '../../../mocks/mockAuxiliaryBaseRepository';
import { MarketWork } from 'src/domain/entities/works.entity';
import {
  mockInsertNotesRepository,
  mockInsertNotesWithDefaultIdRepository,
} from '../../../../test/mocks/mockInsertWorksRepository';

describe('InserWorksRepositor', () => {
  let repository: InsertWorksRepository;

  const mockPrisma = {
    obras: { createMany: jest.fn() },
    tipos: { findMany: jest.fn() },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsertWorksRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<InsertWorksRepository>(InsertWorksRepository);
  });

  afterEach(jest.clearAllMocks);

  describe('insertMarketWorks', () => {
    it('should call prisma.obras.createMany with mapped market works', async () => {
      await repository.insertMarketWorks([
        mockGetAuxiliaryBaseMarket,
        mockGetAuxiliaryBaseMarket2,
      ]);

      expect(mockPrisma.obras.createMany).toHaveBeenCalledWith({
        data: [
          {
            ovnota: 'Obra 1',
            pep: 'PEP001',
            diagrama: 'DGM001',
            entrada: new Date('2024-05-01'),
            referencia: '175ET005244969',
            observ_obra: 'Obra em andamento',
            id_gpm: 10,
            id_tipo: 2,
            prazo: 120,
            mo_planejada: 1483,
            id_turma: 1,
            id_circuito: 5,
            status_ov_sap: 1,
            id_empreendimento: 1,
          },
          {
            ovnota: 'Obra 1',
            pep: 'PEP001',
            diagrama: 'DGM001',
            entrada: new Date('2024-05-01'),
            referencia: '175ET005244969',
            observ_obra: 'Obra em andamento',
            id_gpm: 10,
            id_tipo: 2,
            prazo: 0,
            mo_planejada: 1483,
            id_turma: 1,
            id_circuito: 5,
            status_ov_sap: 1,
            id_empreendimento: 1,
          },
        ],
        skipDuplicates: true,
      });
    });

    it('should call prisma.obras.createMany with mapped market works and default ids', async () => {
      await repository.insertMarketWorks([
        new MarketWork(
          'Obra 1',
          'PEP001',
          new Date('2024-05-01'),
          'Execução em 120 dias',
          '175ET005244969DSRB02',
          null,
          null,
          null,
          null,
          'DGM001',
          'Obra em andamento',
          1,
          'Ativo',
          'Completo',
          1483,
          0,
        ),
      ]);

      expect(mockPrisma.obras.createMany).toHaveBeenCalledWith({
        data: [
          {
            ovnota: 'Obra 1',
            pep: 'PEP001',
            diagrama: 'DGM001',
            entrada: new Date('2024-05-01'),
            referencia: '175ET005244969',
            observ_obra: 'Obra em andamento',
            id_gpm: 1,
            id_tipo: 1,
            prazo: 120,
            mo_planejada: 1483,
            id_turma: 1,
            id_circuito: 1,
            status_ov_sap: 1,
            id_empreendimento: 1,
          },
        ],
        skipDuplicates: true,
      });
    });

    it('should log error if createMany fails', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();
      mockPrisma.obras.createMany.mockRejectedValueOnce(new Error('DB error'));

      await repository.insertMarketWorks([]);

      expect(spy).toHaveBeenCalledWith(
        'Erro ao inserir obras de mercado:',
        expect.any(Error),
      );
    });
  });

  describe('insertNotes', () => {
    it('should call prisma.obras.createMany with mapped notes', async () => {
      await repository.insertNotes([mockInsertNotesRepository]);

      expect(mockPrisma.obras.createMany).toHaveBeenCalledWith({
        data: [
          {
            ovnota: '16004316',
            pep: 'B/000215',
            ordem_dci: '170000023493',
            ordem_dcd: '190000025094',
            ordem_dca: '150000003441',
            ordem_dcim: null,
            entrada: new Date('2025-06-09T00:00:00.000Z'),
            prazo: 90,
            referencia: '195ET005120739',
            mo_planejada: 1482.56,
            qtde_planejada: 16,
            id_gpm: 31,
            id_empreendimento: 1,
            id_tipo: 48,
            id_turma: 1,
            id_circuito: 1,
            capex_mo_plan: 1483,
            capex_mat_plan: 0,
            ano_plan: 2025,
          },
        ],
        skipDuplicates: true,
      });
    });

    it('should call prisma.obras.createMany with mapped notes and default ids', async () => {
      await repository.insertNotes([mockInsertNotesWithDefaultIdRepository]);

      expect(mockPrisma.obras.createMany).toHaveBeenCalledWith({
        data: [
          {
            ovnota: '16004316',
            pep: 'B/000215',
            ordem_dci: '170000023493',
            ordem_dcd: '190000025094',
            ordem_dca: '150000003441',
            ordem_dcim: null,
            entrada: new Date('2025-06-09T00:00:00.000Z'),
            prazo: 90,
            referencia: '195ET005120739',
            mo_planejada: 1482.56,
            qtde_planejada: 16,
            id_gpm: 1,
            id_empreendimento: 1,
            id_tipo: 1,
            id_turma: 1,
            id_circuito: 1,
            capex_mo_plan: 1483,
            capex_mat_plan: 0,
            ano_plan: 2025,
          },
        ],
        skipDuplicates: true,
      });
    });

    it('should log error if createMany fails', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();
      mockPrisma.obras.createMany.mockRejectedValueOnce(new Error('DB error'));

      await repository.insertNotes([]);

      expect(spy).toHaveBeenCalledWith(
        'Erro ao inserir notas:',
        expect.any(Error),
      );
    });
  });

  describe('getGroup', () => {
    it('Should call the method getGroup and return formatted data', async () => {
      mockPrisma.tipos.findMany.mockResolvedValue([
        { id: 1, id_grupo: 4 },
        { id: 2, id_grupo: 4 },
      ]);

      await repository.getGroup();

      expect(mockPrisma.tipos.findMany).toHaveBeenCalledWith({
        select: { id: true, id_grupo: true },
      });
    });

    it('should log error if findMany fails', async () => {
      const spy = jest.spyOn(console, 'error').mockImplementation();
      mockPrisma.tipos.findMany.mockRejectedValueOnce(new Error('DB error'));

      await repository.getGroup();

      expect(spy).toHaveBeenCalledWith(
        'Erro ao procurar grupos:',
        expect.any(Error),
      );
    });
  });
});
