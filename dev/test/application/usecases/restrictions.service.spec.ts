import moment from 'moment';
import { RestrictionsService } from 'src/application/usecases/restrictions.service';
import { RESTRICTIONS_REPOSITORY } from 'src/domain/contracts/IRestrictionsRepository';

import { Test, TestingModule } from '@nestjs/testing';

import {
  mockGetPublicationRestrictionByWorkIdResponse,
  mockGetPublicationRestrictionResponse,
  mockGetRestrictionsFilters,
  mockGetScheduleRestrictionsOutput,
  MockGetScheduleRestrictionsResponse,
  mockInsertPublicationRestrictions,
  mockPublicationRestriction,
  mockUpdatePublicationRestrictions,
  mockUpdatePublicationRestrictionsWithResoltuionDate,
} from '../../mocks/mockRestrictions';

describe('RestrictionsService', () => {
  let service: RestrictionsService;

  const mockRepository = {
    getScheduleRestrictions: vi.fn(),
    getPublicationRestricion: vi.fn(),
    getPublicationRestrictionByWorkId: vi.fn(),
    insertPublicationRestriction: vi.fn(),
    updatePublicationRestriction: vi.fn(),
    deletePublicationRestriction: vi.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestrictionsService,
        { provide: RESTRICTIONS_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<RestrictionsService>(RestrictionsService);

    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('GetScheduleRestrictons', () => {
    it('should return schedule restrictions and correctly format totals from repository response', async () => {
      mockRepository.getScheduleRestrictions.mockResolvedValue(
        MockGetScheduleRestrictionsResponse,
      );

      const response = await service.getScheduleRestricion(
        mockGetRestrictionsFilters,
      );

      expect(response).toEqual(mockGetScheduleRestrictionsOutput);
    });
  });

  describe('GetPublicationRestrictions', () => {
    it('should return publication restrictions with status done and pending and correctly format totals from repository response', async () => {
      mockRepository.getPublicationRestricion.mockResolvedValue(
        mockGetPublicationRestrictionResponse,
      );

      const response = await service.getPublicationRestriction(
        mockGetRestrictionsFilters,
      );

      expect(response).toEqual({
        works: [mockPublicationRestriction],
      });
    });

    it('should return publication restrictions with status done and correctly format totals from repository response', async () => {
      mockRepository.getPublicationRestricion.mockResolvedValue(
        mockGetPublicationRestrictionResponse,
      );

      await service.getPublicationRestriction({
        ...mockGetRestrictionsFilters,
        status: ['done'],
        dataInicial: '01/10/2024',
        dataFinal: '31/10/2024',
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const rest = (({ dataInicial, dataFinal, status, ...r }) => r)(
        mockGetRestrictionsFilters,
      );

      expect(mockRepository.getPublicationRestricion).toHaveBeenCalledWith({
        ...rest,
        filterExecutado: true,
        dataFinal: moment('2024-10-31').startOf('day').toDate(),
        dataInicial: moment('2024-10-01').startOf('day').toDate(),
      });
    });

    it('should return publication restrictions with status pending and correctly format totals from repository response', async () => {
      mockRepository.getPublicationRestricion.mockResolvedValue(
        mockGetPublicationRestrictionResponse,
      );

      await service.getPublicationRestriction({
        ...mockGetRestrictionsFilters,
        status: ['pending'],
        dataInicial: '01/10/2024',
        dataFinal: '31/10/2024',
      });

      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const rest = (({ dataInicial, dataFinal, status, ...r }) => r)(
        mockGetRestrictionsFilters,
      );

      expect(mockRepository.getPublicationRestricion).toHaveBeenCalledWith({
        ...rest,
        filterExecutado: false, // ✅ aqui estava errado
        dataFinal: moment('2024-10-31').startOf('day').toDate(),
        dataInicial: moment('2024-10-01').startOf('day').toDate(),
      });
    });

    it('should return publication restrictions without status and period date and correctly format totals from repository response', async () => {
      mockRepository.getPublicationRestricion.mockResolvedValue(
        mockGetPublicationRestrictionResponse,
      );

      await service.getPublicationRestriction({
        ...mockGetRestrictionsFilters,
        status: undefined,
        dataFinal: undefined,
        dataInicial: undefined,
      });

      expect(mockRepository.getPublicationRestricion).toHaveBeenCalledWith({
        ...mockGetRestrictionsFilters,
        status: undefined,
        dataFinal: undefined,
        dataInicial: undefined,
      });
    });
  });

  describe('GetScheduleRestrictonsByWorkId', () => {
    it('should return schedule restrictions and correctly format totals from repository response', async () => {
      mockRepository.getPublicationRestrictionByWorkId.mockResolvedValue(
        mockGetPublicationRestrictionByWorkIdResponse,
      );

      const response = await service.getPublicationRestrictionsByWorkId(1);

      expect(response).toEqual([
        {
          restricao: 'Aguardando licença ambiental',
          criado_por: 'João Silva',
          responsabilidade: 'PARCEIRA',
          nome_responsavel: 'Maria Souza',
          status_restricao: 'PENDENTE',
          data_resolucao: null,
          criado_em: new Date('2026-05-01'),
          observacao: null,
          observacao_construcao: null,
          restricoes: undefined,
          usuario: undefined,
        },
      ]);
    });
  });

  describe('InsertPublicationRestrictions', () => {
    it('should sent data to inserPublictionRestriction in repository', async () => {
      mockRepository.insertPublicationRestriction.mockResolvedValue(
        mockGetPublicationRestrictionResponse,
      );

      await service.insertPublicationRestriction(
        mockInsertPublicationRestrictions,
      );

      expect(mockRepository.insertPublicationRestriction).toHaveBeenCalledWith(
        mockInsertPublicationRestrictions,
      );
    });
  });

  describe('UpdatePublictionRestrictions', () => {
    it('should sent data to UpdatePublictionRestrictions in repository with resolution date value', async () => {
      await service.updatePublicationRestriction(
        mockUpdatePublicationRestrictionsWithResoltuionDate,
      );

      expect(mockRepository.updatePublicationRestriction).toHaveBeenCalledWith({
        ...mockUpdatePublicationRestrictionsWithResoltuionDate,
        resolutionDate: moment('17-12-2025', 'DD/MM/YYYY', true).toISOString(),
      });
    });

    it('should sent data to UpdatePublictionRestrictions in repository without resolution date value', async () => {
      await service.updatePublicationRestriction(
        mockUpdatePublicationRestrictions,
      );

      expect(mockRepository.updatePublicationRestriction).toHaveBeenCalledWith({
        ...mockUpdatePublicationRestrictionsWithResoltuionDate,
        resolutionDate: null,
      });
    });
  });

  describe('DeletePublicationRestrictions', () => {
    it('should sent id to DeletePublicationRestrictions in repository', async () => {
      await service.deletePublicationRestriction(1);

      expect(mockRepository.deletePublicationRestriction).toHaveBeenCalledWith(
        1,
      );
    });
  });
});
