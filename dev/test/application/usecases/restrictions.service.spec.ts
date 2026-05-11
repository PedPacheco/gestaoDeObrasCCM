import moment from 'moment';
import { RestrictionsService } from 'src/application/usecases/restrictions.service';
import { RESTRICTIONS_REPOSITORY } from 'src/domain/repositories/IRestrictionsRepository';

import { Test, TestingModule } from '@nestjs/testing';

import {
  mockGetRestrictionsFilters,
  mockGetScheduleRestrictions,
  mockInsertPublicationRestrictions,
  mockUpdatePublicationRestrictions,
  mockUpdatePublicationRestrictionsWithResoltuionDate,
} from '../../mocks/mockRestrictions';

describe('RestrictionsService', () => {
  let service: RestrictionsService;

  const mockRepository = {
    getScheduleRestrictions: jest.fn(),
    getPublicationRestricion: jest.fn(),
    getPublicationRestrictionByWorkId: jest.fn(),
    getRestrictionsAdvancePartner: jest.fn(),
    getGripPartner: jest.fn(),
    getScheduledWorks: jest.fn(),
    getReaschedulingReasons: jest.fn(),
    getExecutionRestrictions: jest.fn(),
    insertPublicationRestriction: jest.fn(),
    updatePublicationRestriction: jest.fn(),
    deletePublicationRestriction: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RestrictionsService,
        { provide: RESTRICTIONS_REPOSITORY, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<RestrictionsService>(RestrictionsService);

    jest.clearAllMocks();
    jest.restoreAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('GetScheduleRestrictons', () => {
    it('should return schedule restrictions and correctly format totals from repository response', async () => {
      mockRepository.getScheduleRestrictions.mockResolvedValue({
        works: [mockGetScheduleRestrictions],
        totals: [{ total_obras: 1n }],
      });

      const response = await service.getScheduleRestricion(
        mockGetRestrictionsFilters,
      );

      expect(response).toEqual({
        works: [mockGetScheduleRestrictions],
        totals: { total_obras: 1 },
      });
    });
  });

  describe('GetPublicationRestrictions', () => {
    it('should return publication restrictions with status done and pending and correctly format totals from repository response', async () => {
      mockRepository.getPublicationRestricion.mockResolvedValue({
        works: [mockGetScheduleRestrictions],
      });

      const response = await service.getPublicationRestriction(
        mockGetRestrictionsFilters,
      );

      expect(response).toEqual({
        works: [mockGetScheduleRestrictions],
      });
    });

    it('should return publication restrictions with status done and correctly format totals from repository response', async () => {
      mockRepository.getPublicationRestricion.mockResolvedValue({
        works: [mockGetScheduleRestrictions],
      });

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
      mockRepository.getPublicationRestricion.mockResolvedValue({
        works: [mockGetScheduleRestrictions],
      });

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
      mockRepository.getPublicationRestricion.mockResolvedValue({
        works: [mockGetScheduleRestrictions],
      });

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
      mockRepository.getPublicationRestrictionByWorkId.mockResolvedValue([
        {
          restricoes: { restricao: 'Data' },
          usuario: { nome_usuario: 'Pedro' },
          status_resolucao: 'Pendente',
        },
      ]);

      const response = await service.getPublicationRestrictionsByWorkId(1);

      expect(response).toEqual([
        {
          restricao: 'Data',
          criado_por: 'Pedro',
          status_resolucao: 'Pendente',
        },
      ]);
    });
  });

  describe('getRestrictionsAdvancePartner', () => {
    it('should return restrictions for partner advancement and correctly format totals from repository response', async () => {
      mockRepository.getRestrictionsAdvancePartner.mockResolvedValue([
        {
          mes: '05/2026',
          total: 50,
          sem_restricao: 25,
        },
      ]);

      const response = await service.getRestrictionsAdvancePartner({
        dataInicial: '2026-05-12',
        dataFinal: '2026-05-12',
      });

      expect(response).toEqual([
        {
          month: '05/2026',
          total: 50,
          withoutRestriction: 25,
          withRestriction: 25,
          pct: 50,
        },
      ]);
    });

    it('should return restrictions for partner advancement with total 0 and correctly format totals from repository response', async () => {
      mockRepository.getRestrictionsAdvancePartner.mockResolvedValue([
        {
          mes: '05/2026',
          total: 0,
          sem_restricao: 0,
        },
      ]);

      const response = await service.getRestrictionsAdvancePartner({
        dataInicial: '2026-05-12',
        dataFinal: '2026-05-12',
      });

      expect(response).toEqual([
        {
          month: '05/2026',
          total: 0,
          withoutRestriction: 0,
          withRestriction: 0,
          pct: 0,
        },
      ]);
    });
  });

  describe('getGripPower', () => {
    it('should return mapped partner grip data with numeric conversions and calculated percentage', async () => {
      const returnedData = [
        {
          semana: '18/2026',
          total: 50,
          executada: 25,
          executada_parcial: 10,
          nao_executada: 10,
          nao_informada: 15,
        },
      ];

      mockRepository.getGripPartner.mockResolvedValue(returnedData);

      const response = await service.getGripPartner({
        dataInicial: '2026-05-12',
        dataFinal: '2026-05-12',
      });

      expect(response).toEqual([
        {
          week: '18/2026',
          total: 50,
          executed: 25,
          partialExecuted: 10,
          notExecuted: 10,
          notInformed: 15,
          pct: 50,
        },
      ]);
    });

    it('should return percentage as 0 when total restrictions is zero', async () => {
      const returnedData = [
        {
          semana: '18/2026',
          total: 0,
          executada: 0,
          executada_parcial: 0,
          nao_executada: 0,
          nao_informada: 0,
        },
      ];

      mockRepository.getGripPartner.mockResolvedValue(returnedData);

      const response = await service.getGripPartner({});

      expect(response).toEqual([
        {
          week: '18/2026',
          total: 0,
          executed: 0,
          partialExecuted: 0,
          notExecuted: 0,
          notInformed: 0,
          pct: 0,
        },
      ]);
    });
  });

  describe('getScheduledWorks', () => {
    it('should return mapped scheduled works data with numeric conversions and calculated sem_restricao', async () => {
      const returnedData = [
        {
          mes: '03/2026',
          com_restricao: 50,
          total_programadas: 100,
        },
      ];

      mockRepository.getScheduledWorks.mockResolvedValue(returnedData);

      const response = await service.getScheduledWorks({
        dataInicial: '2026-05-12',
        dataFinal: '2026-05-12',
      });

      expect(response).toEqual([
        {
          month: '03/2026',
          totalScheduled: 100,
          withRestriction: 50,
          withoutRestriction: 50,
        },
      ]);
    });
  });

  describe('getReaschedulingReasons', () => {
    it('should return rescheduling reasons data with ovnota and motivo fields', async () => {
      const returnedData = [
        {
          ovnota: '12342545',
          motivo: 'Trânsito',
        },
      ];

      mockRepository.getReaschedulingReasons.mockResolvedValue(returnedData);

      const response = await service.getReaschedulingReasons({
        dataInicial: '2026-05-12',
        dataFinal: '2026-05-12',
      });

      expect(response).toEqual(returnedData);
    });
  });

  describe('getExecutionRestriction', () => {
    it('should return execution restriction data with ovnota and restricao fields', async () => {
      const returnedData = [
        {
          ovnota: '12342545',
          restricao: 'Trânsito',
        },
      ];

      mockRepository.getExecutionRestrictions.mockResolvedValue(returnedData);

      const response = await service.getExecutionRestrictions({
        dataInicial: '2026-05-12',
        dataFinal: '2026-05-12',
      });

      expect(response).toEqual(returnedData);
    });
  });

  describe('InsertPublicationRestrictions', () => {
    it('should sent data to inserPublictionRestriction in repository', async () => {
      mockRepository.insertPublicationRestriction.mockResolvedValue({
        works: [mockGetScheduleRestrictions],
      });

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
