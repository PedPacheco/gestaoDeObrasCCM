import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { AuxiliaryBaseRepository } from 'src/infra/repositories/auxiliaryBaseRepository';
import {
  mockGetAuxiliaryBaseMarket,
  mockGetNotes,
  mockInsertNotesRequest,
} from '../../../test/mocks/mockAuxiliaryBaseRepository';
import {
  mockInsertAuxiliaryBaseMarket,
  mockInsertAuxiliaryBaseMarketWithDefaultId,
} from '../../../test/mocks/mocksAuxiliaryBaseController';
import {
  mockCalculatedValues,
  mockReturnAuxiliaryBaseCN52N,
} from '../../mocks/mocksMaterialCapex';

describe('AuxiliaryBaseRepository', () => {
  let repository: AuxiliaryBaseRepository;

  const mockPrisma = {
    base_auxiliar: {
      findMany: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    base_auxiliar_ov: {
      findMany: jest.fn(),
      delete: jest.fn(),
      createMany: jest.fn(),
      deleteMany: jest.fn(),
    },
    cn52n: { createMany: jest.fn() },
    conversao: { findMany: jest.fn() },
    municipios: { findMany: jest.fn() },
    tipos: { findMany: jest.fn() },
    circuitos: { findMany: jest.fn() },
    $executeRawUnsafe: jest.fn(),
    $queryRawUnsafe: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuxiliaryBaseRepository,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    repository = module.get<AuxiliaryBaseRepository>(AuxiliaryBaseRepository);
  });

  afterEach(jest.clearAllMocks);

  describe('getAuxiliaryBaseNotes', () => {
    it('should call method getAuxiliaryBaseNotes and return formatted data with regional filter', async () => {
      mockPrisma.base_auxiliar.findMany.mockResolvedValue(mockGetNotes);

      await repository.getAuxiliaryBaseNotes(1);

      expect(mockPrisma.base_auxiliar.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { municipios: { id_regional: 1 } },
        }),
      );
    });

    it('should call method getAuxiliaryBaseNotes and return formatted data without regional filter', async () => {
      mockPrisma.base_auxiliar.findMany.mockResolvedValue(mockGetNotes);

      await repository.getAuxiliaryBaseNotes();

      expect(mockPrisma.base_auxiliar.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { municipios: { id_regional: undefined } },
        }),
      );
    });
  });

  describe('getAuxiliaryBaseMarket', () => {
    it('should call method getAuxiliaryBaseMarket and return formatted data with regional filter', async () => {
      mockPrisma.base_auxiliar_ov.findMany.mockResolvedValue([
        {
          id: 56,
          obra: 'Obra 1',
          pep: 'PEP001',
          diagrama: 'DGM001',
          prazo_texto: 'Execução em 120 dias',
          entrada: new Date('2024-05-01'),
          status_ov: 1,
          status_diagrama: 'Ativo',
          status_pep: 'Completo',
          mo_cliente: 1483,
          mo_empresa: 0,
          aux_circuito: 5,
          aux_municipio: 10,
          aux_turma: 1,
          aux_tipo_obra: 2,
          equip_num_pedido: '175ET005244969DSRB02',
          observacao: 'Obra em andamento',
        },
      ]);

      const result = await repository.getAuxiliaryBaseMarket(1);

      expect(mockPrisma.base_auxiliar_ov.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { municipios: { id_regional: 1 } },
        }),
      );
      expect(result).toEqual([mockGetAuxiliaryBaseMarket]);
    });

    it('should call method getAuxiliaryBaseMarket and return formatted data without regional filter', async () => {
      mockPrisma.base_auxiliar_ov.findMany.mockResolvedValue([
        {
          id: 56,
          obra: 'Obra 1',
          pep: 'PEP001',
          diagrama: 'DGM001',
          prazo_texto: 'Execução em 120 dias',
          entrada: new Date('2024-05-01'),
          status_ov: 1,
          status_diagrama: 'Ativo',
          status_pep: 'Completo',
          mo_cliente: 1483,
          mo_empresa: 0,
          aux_circuito: 5,
          aux_municipio: 10,
          aux_turma: 1,
          aux_tipo_obra: 2,
          equip_num_pedido: '175ET005244969DSRB02',
          observacao: 'Obra em andamento',
        },
      ]);

      const result = await repository.getAuxiliaryBaseMarket();

      expect(mockPrisma.base_auxiliar_ov.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { municipios: { id_regional: undefined } },
        }),
      );
      expect(result).toEqual([mockGetAuxiliaryBaseMarket]);
    });
  });

  describe('getAuxiliaryBaseCN52N', () => {
    it('should call method getAuxiliaryBaseCN52N and return formatted data', async () => {
      mockPrisma.$queryRawUnsafe.mockResolvedValue(
        mockReturnAuxiliaryBaseCN52N,
      );

      const result = await repository.getAuxiliaryBaseCN52N();

      expect(result).toEqual(mockReturnAuxiliaryBaseCN52N);
      expect(mockPrisma.$queryRawUnsafe).toHaveBeenCalledTimes(1);
    });
  });

  describe('getFator', () => {
    it('should call method getFator and return formatted data of fator', async () => {
      const fatorMap = new Map<string, number>();
      fatorMap.set('material1|12345', 1);

      mockPrisma.conversao.findMany.mockResolvedValue([
        { material: 'material1', pep_ref: '12345', fator: 1 },
      ]);

      const result = await repository.getFator([
        { material: 'material1', pep_ref: '12345' },
      ]);

      expect(mockPrisma.conversao.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { OR: [{ material: 'material1', pep_ref: '12345' }] },
        }),
      );
      expect(result).toEqual(fatorMap);
    });
  });

  describe('delete', () => {
    it('Should delete data of base_auxiliar_ov', async () => {
      await repository.delete('baseOv', 56);

      expect(mockPrisma.base_auxiliar_ov.delete).toHaveBeenCalled();
      expect(mockPrisma.base_auxiliar.delete).not.toHaveBeenCalled();
    });

    it('Should delete data of base_auxiliar_ov without id', async () => {
      await repository.delete('baseOv', undefined);

      expect(mockPrisma.base_auxiliar_ov.deleteMany).toHaveBeenCalled();
      expect(mockPrisma.base_auxiliar.deleteMany).not.toHaveBeenCalled();
    });

    it('Should delete data of base_auxiliar', async () => {
      await repository.delete('baseNote', 56);

      expect(mockPrisma.base_auxiliar_ov.delete).not.toHaveBeenCalled();
      expect(mockPrisma.base_auxiliar.delete).toHaveBeenCalled();
    });

    it('Should delete data of base_auxiliar without id', async () => {
      await repository.delete('baseNote', undefined);

      expect(mockPrisma.base_auxiliar_ov.deleteMany).not.toHaveBeenCalled();
      expect(mockPrisma.base_auxiliar.deleteMany).toHaveBeenCalled();
    });

    it('should log error if createMany fails', async () => {
      const error = new Error('Erro ao deletar obra');

      mockPrisma.base_auxiliar_ov.delete.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(repository['logger'], 'error');

      await expect(repository.delete('baseOv', 56)).rejects.toThrow(
        'Erro ao deletar obra',
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        'Erro ao excluir obra: ',
        error.stack,
      );
    });
  });

  describe('insertMarket', () => {
    it('should call the method insertMarket and insert data in the auxiliary base ov', async () => {
      mockPrisma.municipios.findMany.mockResolvedValue([{ id: 2, mun: 'SJC' }]);
      mockPrisma.tipos.findMany.mockResolvedValue([
        { id: 15, descricao_sap: 'Poste' },
      ]);
      mockPrisma.circuitos.findMany.mockResolvedValue([
        { id: 53, circuito: 'APA-1324' },
      ]);

      await repository.insertMarket(mockInsertAuxiliaryBaseMarket);

      expect(mockPrisma.base_auxiliar_ov.createMany).toHaveBeenCalledWith({
        data: [
          {
            obra: '14245355',
            pep: 'PEP-AUX001',
            diagrama: 'DGM-AUX001',
            gpm: 'SJC',
            tipo: 'Poste',
            circuito: 'APA-1324',
            prazo_texto: '20 dias úteis',
            status_ov: 1,
            status_diagrama: 'Completo',
            status_pep: 'Ativo',
            equip_num_pedido: 'EQ-AUX001',
            mo_cliente: 5000,
            mo_empresa: 7000,
            entrada: new Date('2024-05-10'),
            aux_municipio: 2,
            aux_tipo_obra: 15,
            aux_circuito: 53,
            aux_turma: 1,
          },
        ],
        skipDuplicates: true,
      });
    });

    it('should call the method insertMarket and insert data in the auxiliary base ov with default id', async () => {
      mockPrisma.municipios.findMany.mockResolvedValue([{ id: 2, mun: 'SJC' }]);
      mockPrisma.tipos.findMany.mockResolvedValue([
        { id: 15, descricao_sap: 'Poste' },
      ]);
      mockPrisma.circuitos.findMany.mockResolvedValue([
        { id: 53, circuito: 'APA-1324' },
      ]);

      await repository.insertMarket(mockInsertAuxiliaryBaseMarketWithDefaultId);

      expect(mockPrisma.base_auxiliar_ov.createMany).toHaveBeenCalledWith({
        data: [
          {
            obra: '14245355',
            pep: 'PEP-AUX001',
            diagrama: 'DGM-AUX001',
            gpm: 'São',
            tipo: 'Atravessia',
            circuito: 'APA-1326',
            prazo_texto: '20 dias úteis',
            status_ov: 1,
            status_diagrama: 'Completo',
            status_pep: 'Ativo',
            equip_num_pedido: 'EQ-AUX001',
            mo_cliente: 5000,
            mo_empresa: 7000,
            entrada: new Date('2024-05-10'),
            aux_municipio: 1,
            aux_tipo_obra: 1,
            aux_circuito: 1,
            aux_turma: 1,
          },
        ],
        skipDuplicates: true,
      });
    });

    it('should log error if createMany fails', async () => {
      const error = new Error('Erro ao inserir dados da base auxiliar OV:');

      mockPrisma.base_auxiliar_ov.createMany.mockRejectedValue(error);
      const loggerSpy = jest.spyOn(repository['logger'], 'error');

      await expect(repository.insertMarket([])).rejects.toThrow(
        'Falha ao inserir dados da base auxiliar OV',
      );

      expect(loggerSpy).toHaveBeenCalledWith(
        'Erro ao inserir dados da base auxiliar OV:',
        error.stack,
      );
    });
  });

  describe('insertNote', () => {
    it('should call the method insertMarket and insert data in the auxiliary base ov', async () => {
      const result = await repository.insertNotes(mockInsertNotesRequest);

      const clean = (str: string) => str.replace(/\s+/g, ' ').trim();

      expect(clean(mockPrisma.$executeRawUnsafe.mock.calls[0][0])).toBe(
        clean(
          `SELECT construcao_sp.insert_base_auxiliar_bulk(ARRAY[( '16005338', 'B/000215-3', NULL, '190000025090', NULL, NULL, '69', 'CAR', 'RIO DO OURO - ETAPA 2 - DCD', '195ET005120739' ),( '16004316', 'B/000215-7', '170000023493', '190000025094', '150000003441', NULL, '69', 'CAR', 'RIO DO OURO - ETAPA 2 - DCI', '195ET005120739' )]::construcao_sp.base_auxiliar_input[])`,
        ),
      );
      expect(result).toEqual({ message: 'Dados inseridos com sucesso' });
    });

    it('should log error if createMany fails', async () => {
      mockPrisma.$executeRawUnsafe.mockRejectedValueOnce(new Error('DB error'));
      await expect(repository.insertNotes([])).rejects.toThrow();
    });
  });

  describe('insertCapex', () => {
    it('should call the method insertMarket and insert data in the auxiliary base ov', async () => {
      await repository.insertCapex(mockCalculatedValues);

      expect(mockPrisma.cn52n.createMany).toHaveBeenCalledWith({
        data: mockCalculatedValues,
      });
      expect(mockPrisma.cn52n.createMany).toHaveBeenCalledTimes(1);
    });

    it('should log error if createMany fails', async () => {
      mockPrisma.cn52n.createMany.mockRejectedValueOnce(new Error('DB error'));
      await expect(
        repository.insertCapex(mockCalculatedValues),
      ).rejects.toThrow();
    });
  });
});
