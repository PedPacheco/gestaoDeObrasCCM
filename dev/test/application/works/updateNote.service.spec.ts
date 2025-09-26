import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { FindExistingWorksService } from 'src/application/works/findExistingWorks.service';
import { UpdateNoteService } from 'src/application/works/updateNote.service';
import { INSERT_WORKS_REPOSITORY } from 'src/domain/repositories/works/IInsertWorksRepository';
import { UPDATE_NOTE_REPOSITORY } from 'src/domain/repositories/works/IUpdateNoteRepository';
import { mockUpdateNotes } from '../../mocks/mockWorksController';

describe('UpdateNoteService', () => {
  let updateNoteService: UpdateNoteService;

  const mockRepository = {
    update: jest.fn(),
  };

  const mockFindExistingWorksService = {
    findExistingNotes: jest.fn(),
  };

  const mockInsertWorksRepository = {
    getGroup: jest.fn(),
  };

  const mockExistingNotes = [
    {
      id: 1,
      ovnota: '4001841383',
      ordemDci: 'DCI001',
      ordemDcd: 'DCD001',
      ordemDca: null,
      ordemDcim: null,
    },
    {
      id: 2,
      ovnota: '4001854143',
      ordemDci: null,
      ordemDcd: null,
      ordemDca: 'DCA002',
      ordemDcim: 'DCIM002',
    },
  ];

  const mockNotExistingNotes = [
    {
      id: 2,
      ovnota: '4001841383',
      ordemDci: 'ordemDCI1',
      ordemDcd: 'ordemDCD1',
      ordemDca: 'ordemDCA1',
      ordemDcim: 'ordemDCIM1',
    },
  ];

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateNoteService,
        { provide: UPDATE_NOTE_REPOSITORY, useValue: mockRepository },
        {
          provide: FindExistingWorksService,
          useValue: mockFindExistingWorksService,
        },
        {
          provide: INSERT_WORKS_REPOSITORY,
          useValue: mockInsertWorksRepository,
        },
      ],
    }).compile();

    updateNoteService = module.get<UpdateNoteService>(UpdateNoteService);

    mockInsertWorksRepository.getGroup.mockResolvedValue([
      { id: 1, id_grupo: 4 },
      { id: 2, id_grupo: 4 },
    ]);

    mockFindExistingWorksService.findExistingNotes.mockResolvedValue(
      mockExistingNotes,
    );
  });

  afterEach(jest.clearAllMocks);

  describe('Update', () => {
    it('should throw BadRequestException if no data is provided', async () => {
      await expect(updateNoteService.update([])).rejects.toThrow(
        BadRequestException,
      );

      await expect(updateNoteService.update([])).rejects.toThrow(
        'Nenhum dado enviado.',
      );
    });

    it('should call updateNoteRepository.update with transformed data when valid works exist', async () => {
      await updateNoteService.update(mockUpdateNotes);

      expect(mockRepository.update).toHaveBeenCalledWith([
        {
          id: 1,
          ovnota: '4001841383',
          entrada: new Date('2023-01-10'),
          referencia: 'REF123',
          id_gpm: 101,
          id_empreendimento: 201,
          id_tipo: 1,
          id_circuito: 12,
          ano_plan: 2023,
          pep: 'PEP-123456',
          ordem_dci: 'DCI001',
          ordem_dcd: 'DCD001',
          mo_plan: 100,
          qtde_plan: 50,
          capex_mo_plan: 20000,
          capex_mat_plan: 15000,
        },
        {
          id: 2,
          ovnota: '4001854143',
          entrada: new Date('2023-02-15'),
          referencia: 'REF456',
          id_gpm: 102,
          id_empreendimento: 202,
          id_tipo: 2,
          id_circuito: 15,
          ano_plan: 2024,
          pep: 'PEP-654321',
          ordem_dca: 'DCA002',
          ordem_dcim: 'DCIM002',
          mo_plan: 120,
          qtde_plan: 60,
          capex_mo_plan: 25000,
          capex_mat_plan: 18000,
        },
      ]);
    });

    it('should call updateOvRepository.update with transformed data when valid works exist', async () => {
      await updateNoteService.update([
        {
          obra: '4001841383',
          entrada: null,
          prazo: null,
          referencia: null,
          idMunicipio: null,
          idEmpreendimento: null,
          idTipo: 1,
          idTurma: null,
          idCircuito: null,
          anoplan: null,
          pep: null,
          ordem_dci: null,
          ordem_dcd: null,
          moPlan: 1,
          qtdePlan: null,
          capexMoPlan: null,
          capexMatPlan: null,
        },
      ]);

      expect(mockRepository.update).toHaveBeenCalledWith([
        { id: 1, id_tipo: 1, mo_plan: 1, ovnota: '4001841383' },
      ]);
    });

    it('should call updateNoteRepository.update with transformed data when valid works not exist', async () => {
      mockFindExistingWorksService.findExistingNotes.mockResolvedValue(
        mockNotExistingNotes,
      );

      await updateNoteService.update(mockUpdateNotes);

      expect(mockRepository.update).toHaveBeenCalledWith([]);
    });

    it('should skip update when ordem_dci does not match', async () => {
      const wrongWork = mockUpdateNotes.map((work) => ({
        ...work,
        ordem_dci: 'WRONG_DCI',
      }));
      await updateNoteService.update(wrongWork);
      expect(mockRepository.update).toHaveBeenCalledWith([]);
    });

    it('should skip update when ordem_dcd does not match', async () => {
      const wrongWork = mockUpdateNotes.map((work) => ({
        ...work,
        ordem_dcd: 'WRONG_DCD',
      }));
      await updateNoteService.update(wrongWork);
      expect(mockRepository.update).toHaveBeenCalledWith([]);
    });

    it('should skip update when ordem_dca does not match', async () => {
      const wrongWork = mockUpdateNotes.map((work) => ({
        ...work,
        ordem_dca: 'WRONG_DCA',
      }));
      await updateNoteService.update(wrongWork);
      expect(mockRepository.update).toHaveBeenCalledWith([]);
    });

    it('should skip update when ordem_dcim does not match', async () => {
      const wrongWork = mockUpdateNotes.map((work) => ({
        ...work,
        ordem_dcim: 'WRONG_DCIM',
      }));
      await updateNoteService.update(wrongWork);
      expect(mockRepository.update).toHaveBeenCalledWith([]);
    });
  });
});
