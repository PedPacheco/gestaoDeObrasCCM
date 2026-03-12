import { AuxiliaryBaseService } from 'src/application/usecases/auxiliaryBase/auxiliaryBase.service';
import { FindExistingWorksService } from 'src/application/usecases/works/findExistingWorks.service';
import { InsertWorksService } from 'src/application/usecases/works/InsertWorks.service';
import { INSERT_WORKS_REPOSITORY } from 'src/domain/repositories/works/IInsertWorksRepository';

import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

import { mockInsertNotes } from '../../../test/mocks/mockAuxiliaryBaseRepository';
import { mockMappedNotes } from '../../../test/mocks/mocksAuxiliaryBaseController';
import { mockMarketWorks } from '../../../test/mocks/mockWorksController';

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
        mockMarketWorks.map((work, index) => ({
          ...work,
          id: undefined,
          moPlanejada: 7500,
          prazo: index === 0 ? 30 : 0,
          observacao: undefined,
        })),
      );
      expect(result).toEqual({
        message: 'Inserção concluída com sucesso.',
        insertedCount: mockMarketWorks.map((work, index) => ({
          ...work,
          id: undefined,
          moPlanejada: 7500,
          prazo: index === 0 ? 30 : 0,
          observacao: undefined,
        })),
        skipped: ['14245356'],
      });
    });
  });

  describe('insertNotes', () => {
    it('should throw BadRequestException when obra has generic PEP', async () => {
      const mockWrongPep = [
        {
          ...mockInsertNotes[0],
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

    it('should throw BadRequestException when obra has type work invalid', async () => {
      const mockWithTypeWorkInvalid = [
        {
          ...mockInsertNotes[0],
          aux_tipo: 1,
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
        .mockResolvedValue([{ id: 1, id_grupo: 2 }]);

      await expect(
        insertWorksService.insertNotes(mockWithTypeWorkInvalid),
      ).rejects.toThrow('Selecione um tipo de obra');
    });

    it('should throw BadRequestException when obra has circuit invalid', async () => {
      const mockWihCircuitInvalid = [
        {
          ...mockInsertNotes[0],
          aux_circuito: 1,
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
        insertWorksService.insertNotes(mockWihCircuitInvalid),
      ).rejects.toThrow('Selecione um circuito');
    });

    it('should throw BadRequestException when obra has no rda', async () => {
      const mockWithRdaInvalid = [
        {
          ...mockInsertNotes[0],
          ehRda: true,
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
        insertWorksService.insertNotes(mockWithRdaInvalid),
      ).rejects.toThrow('Necessário selecionar o tipo da RDA');
    });

    it('should throw BadRequestException when obra has invalid empreendimento for group 3 or 4', async () => {
      jest
        .spyOn(auxiliaryBaseService, 'getNotes')
        .mockResolvedValue(mockMappedNotes);

      jest
        .spyOn(mockRepository, 'getGroup')
        .mockResolvedValue([{ id: 48, id_grupo: 4 }]);

      await expect(
        insertWorksService.insertNotes(mockInsertNotes),
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

      await insertWorksService.insertNotes(mockInsertNotes);

      expect(mockRepository.insertNotes).toHaveBeenCalled();
    });
  });
});
