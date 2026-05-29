import { TeamAggregationService } from 'src/domain/services/teamAggregator.service';

describe('TeamAggregationService', () => {
  let service: TeamAggregationService;

  beforeEach(() => {
    service = new TeamAggregationService();
  });

  describe('buildTotalTeamsMap', () => {
    it('should return an empty map when data is empty', () => {
      const result = service.buildTotalTeamsMap([]);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('should aggregate teams by formatted date', () => {
      const data: any[] = [
        {
          data_prog: '2024-03-15T00:00:00.000Z',
          equipe_linha_morta: 1,
          equipe_linha_viva: 2,
          equipe_regularizacao: 3,
        },
      ];

      const result = service.buildTotalTeamsMap(data);

      expect(result.get('15/03/2024')).toBe(6);
    });

    it('should sum multiple records for the same date', () => {
      const data: any[] = [
        {
          data_prog: '2024-03-15T00:00:00.000Z',
          equipe_linha_morta: 1,
          equipe_linha_viva: 1,
          equipe_regularizacao: 1,
        },
        {
          data_prog: '2024-03-15T10:00:00.000Z',
          equipe_linha_morta: 2,
          equipe_linha_viva: 2,
          equipe_regularizacao: 2,
        },
      ];

      const result = service.buildTotalTeamsMap(data);

      expect(result.get('15/03/2024')).toBe(9);
    });

    it('should create different entries for different dates', () => {
      const data: any[] = [
        {
          data_prog: '2024-03-15T00:00:00.000Z',
          equipe_linha_morta: 1,
          equipe_linha_viva: 1,
          equipe_regularizacao: 1,
        },
        {
          data_prog: '2024-03-16T00:00:00.000Z',
          equipe_linha_morta: 2,
          equipe_linha_viva: 2,
          equipe_regularizacao: 2,
        },
      ];

      const result = service.buildTotalTeamsMap(data);

      expect(result.get('15/03/2024')).toBe(3);
      expect(result.get('16/03/2024')).toBe(6);
    });

    it('should treat undefined team values as 0', () => {
      const data: any[] = [
        {
          data_prog: '2024-03-15T00:00:00.000Z',
          equipe_linha_morta: undefined,
          equipe_linha_viva: null,
          equipe_regularizacao: 5,
        },
      ];

      const result = service.buildTotalTeamsMap(data);

      expect(result.get('15/03/2024')).toBe(5);
    });

    it('should treat all nullish values as 0', () => {
      const data: any[] = [
        {
          data_prog: '2024-03-15T00:00:00.000Z',
          equipe_linha_morta: undefined,
          equipe_linha_viva: undefined,
          equipe_regularizacao: undefined,
        },
      ];

      const result = service.buildTotalTeamsMap(data);

      expect(result.get('15/03/2024')).toBe(0);
    });
  });

  describe('buildExecutionCapacityTeams', () => {
    beforeAll(() => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date('2024-03-15T00:00:00.000Z'));
    });

    afterAll(() => {
      jest.useRealTimers();
    });

    it('should return null values when dates are from different months', () => {
      const result = service.buildExecutionCapacityTeams(
        '01/03/2024',
        '01/04/2024',
        [],
      );

      expect(result).toEqual({
        rfpTeams: null,
        executionCapacityTeams: null,
      });
    });

    it('should return null values when dates are from different years', () => {
      const result = service.buildExecutionCapacityTeams(
        '01/12/2024',
        '01/01/2025',
        [],
      );

      expect(result).toEqual({
        rfpTeams: null,
        executionCapacityTeams: null,
      });
    });

    it('should return zero totals when data is empty', () => {
      const result = service.buildExecutionCapacityTeams(
        '01/03/2024',
        '31/03/2024',
        [],
      );

      expect(result).toEqual({
        rfpTeams: 0,
        executionCapacityTeams: 0,
      });
    });

    it('should aggregate values for the selected month', () => {
      const data = [
        {
          ano: 2024,
          qtd_equipes_rfp: 5,
          mar: 10,
        },
        {
          ano: 2024,
          qtd_equipes_rfp: 3,
          mar: 7,
        },
      ];

      const result = service.buildExecutionCapacityTeams(
        '01/03/2024',
        '31/03/2024',
        data,
      );

      expect(result).toEqual({
        rfpTeams: 8,
        executionCapacityTeams: 17,
      });
    });

    it('should ignore records from different years', () => {
      const data = [
        {
          ano: 2023,
          qtd_equipes_rfp: 99,
          mar: 99,
        },
        {
          ano: 2024,
          qtd_equipes_rfp: 5,
          mar: 10,
        },
      ];

      const result = service.buildExecutionCapacityTeams(
        '01/03/2024',
        '31/03/2024',
        data,
      );

      expect(result).toEqual({
        rfpTeams: 5,
        executionCapacityTeams: 10,
      });
    });

    it('should treat undefined values as 0', () => {
      const data = [
        {
          ano: 2024,
          qtd_equipes_rfp: undefined,
          mar: undefined,
        },
      ];

      const result = service.buildExecutionCapacityTeams(
        '01/03/2024',
        '31/03/2024',
        data,
      );

      expect(result).toEqual({
        rfpTeams: 0,
        executionCapacityTeams: 0,
      });
    });

    it('should use the correct month field dynamically', () => {
      const data = [
        {
          ano: 2024,
          qtd_equipes_rfp: 4,
          jan: 1,
          fev: 2,
          mar: 3,
          abr: 4,
        },
      ];

      const marchResult = service.buildExecutionCapacityTeams(
        '01/03/2024',
        '31/03/2024',
        data,
      );

      const aprilResult = service.buildExecutionCapacityTeams(
        '01/04/2024',
        '30/04/2024',
        data,
      );

      expect(marchResult).toEqual({
        rfpTeams: 4,
        executionCapacityTeams: 3,
      });

      expect(aprilResult).toEqual({
        rfpTeams: 4,
        executionCapacityTeams: 4,
      });
    });

    it('should accumulate multiple records correctly', () => {
      const data = [
        {
          ano: 2024,
          qtd_equipes_rfp: 1,
          mar: 2,
        },
        {
          ano: 2024,
          qtd_equipes_rfp: 3,
          mar: 4,
        },
        {
          ano: 2024,
          qtd_equipes_rfp: 5,
          mar: 6,
        },
      ];

      const result = service.buildExecutionCapacityTeams(
        '01/03/2024',
        '31/03/2024',
        data,
      );

      expect(result).toEqual({
        rfpTeams: 9,
        executionCapacityTeams: 12,
      });
    });
  });
});
