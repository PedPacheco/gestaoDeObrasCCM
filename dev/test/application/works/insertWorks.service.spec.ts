import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { INSERT_WORKS_REPOSITORY } from 'src/domain/repositories/works/IInsertWorksRepository';

import { InsertWorksService } from 'src/application/works/InsertWorks.service';
import { FindExistingWorksService } from 'src/application/works/findExistingWorks.service';
import { AuxiliaryBaseService } from 'src/application/auxiliaryBase/auxiliaryBase.service';
import { mockMarketWorks } from '../../../test/mocks/mockWorksController';
import { mockGetNotes } from '../../../test/mocks/mockAuxiliaryBaseRepository';
import { mockMappedNotes } from '../../../test/mocks/mocksAuxiliaryBaseController';

describe('InsertWorksService', () => {
  let insertWorksService: InsertWorksService;
  let findExistingWorksService: FindExistingWorksService;
  let auxiliaryBaseService: AuxiliaryBaseService;

  const mockRepository = {
    insertMarketWorks: jest.fn(),
    insertNotes: jest.fn(),
    getGroup: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsertWorksService,
        { provide: INSERT_WORKS_REPOSITORY, useValue: mockRepository },
        {
          provide: FindExistingWorksService,
          useValue: {
            findExistingWorks: jest.fn(),
            findExistingOrders: jest.fn(),
          },
        },
        { provide: AuxiliaryBaseService, useValue: { getNotes: jest.fn() } },
      ],
    }).compile();

    insertWorksService = module.get<InsertWorksService>(InsertWorksService);
    findExistingWorksService = module.get<FindExistingWorksService>(
      FindExistingWorksService,
    );
    auxiliaryBaseService =
      module.get<AuxiliaryBaseService>(AuxiliaryBaseService);
  });

  describe('insertMarketWorks', () => {
    it('should call method insertMarketWorks and throw error if no data send', async () => {
      await expect(insertWorksService.insertMarketWorks([])).rejects.toThrow(
        BadRequestException,
      );

      await expect(insertWorksService.insertMarketWorks([])).rejects.toThrow(
        'Nenhuma obra fornecida para inserção.',
      );
    });

    it('should call method insertMarketWorks and throw error if no data is valid', async () => {
      jest
        .spyOn(findExistingWorksService, 'findExistingWorks')
        .mockResolvedValue([
          { id: 1, ovnota: '1424535' },
          { id: 2, ovnota: '1424537' },
        ]);

      await expect(
        insertWorksService.insertMarketWorks(mockMarketWorks),
      ).rejects.toThrow(BadRequestException);

      await expect(
        insertWorksService.insertMarketWorks(mockMarketWorks),
      ).rejects.toThrow(
        `Todas as obras já existem no banco de dados: 1424535, 1424537`,
      );
    });

    it('should call method insertMarketWorks and return the default format of data', async () => {
      jest
        .spyOn(findExistingWorksService, 'findExistingWorks')
        .mockResolvedValue([{ id: 1, ovnota: '14245356' }]);

      const result =
        await insertWorksService.insertMarketWorks(mockMarketWorks);

      expect(mockRepository.insertMarketWorks).toHaveBeenCalledWith(
        mockMarketWorks.map((work) => ({
          ...work,
          id: undefined,
          moPlanejada: 7500,
        })),
      );
      expect(result).toEqual({
        message: 'Inserção concluída com sucesso.',
        insertedCount: mockMarketWorks.map((work) => ({
          ...work,
          id: undefined,
          moPlanejada: 7500,
        })),
        skipped: ['14245356'],
      });
    });
  });

  describe('insertNotes', () => {
    it('should throw BadRequestException when obra has generic PEP', async () => {
      const mockWrongPep = [
        {
          ...mockGetNotes[0],
          pep: 'X/003999-001',
        },
      ];

      const mockReturnNote = [
        {
          ...mockMappedNotes[0],
          pep: 'X/003999-001',
        },
      ];

      jest
        .spyOn(auxiliaryBaseService, 'getNotes')
        .mockResolvedValue(mockReturnNote);

      jest
        .spyOn(mockRepository, 'getGroup')
        .mockResolvedValue([{ id: 48, id_grupo: 2 }]);

      await expect(
        insertWorksService.insertNotes(mockWrongPep),
      ).rejects.toThrow(`Obra 16004316 está com PEP genérico.`);
    });

    it('should throw BadRequestException when obra has no moPlanejada', async () => {
      const mockWithoutMo = [
        {
          ...mockGetNotes[0],
          mo_plan: 0,
        },
      ];

      const mockReturnNote = [
        {
          ...mockMappedNotes[0],
          mo_plan: 0,
        },
      ];

      jest
        .spyOn(auxiliaryBaseService, 'getNotes')
        .mockResolvedValue(mockReturnNote);

      jest
        .spyOn(mockRepository, 'getGroup')
        .mockResolvedValue([{ id: 48, id_grupo: 2 }]);

      await expect(
        insertWorksService.insertNotes(mockWithoutMo),
      ).rejects.toThrow(`Obra 16004316 não tem valor de Mão de Obra.`);
    });

    it('should throw BadRequestException when obra has invalid empreendimento for group 3 or 4', async () => {
      jest
        .spyOn(auxiliaryBaseService, 'getNotes')
        .mockResolvedValue(mockMappedNotes);

      jest
        .spyOn(mockRepository, 'getGroup')
        .mockResolvedValue([{ id: 48, id_grupo: 4 }]);

      await expect(
        insertWorksService.insertNotes(mockGetNotes),
      ).rejects.toThrow(
        `Selecione um empreendimento válido para a obra 16004316.`,
      );
    });

    it('should insert notes successfully when all data is valid', async () => {
      jest
        .spyOn(auxiliaryBaseService, 'getNotes')
        .mockResolvedValue(mockMappedNotes);

      jest
        .spyOn(mockRepository, 'getGroup')
        .mockResolvedValue([{ id: 48, id_grupo: 2 }]);

      await insertWorksService.insertNotes(mockGetNotes);

      expect(mockRepository.insertNotes).toHaveBeenCalled();
    });
  });
});
