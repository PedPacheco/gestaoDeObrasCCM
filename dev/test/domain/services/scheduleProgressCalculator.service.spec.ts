import { Test, TestingModule } from '@nestjs/testing';
import { ScheduleProgressCalculatorService } from 'src/domain/services/scheduleProgressCalculator.service';

describe('ScheduleProgressCalculatorService', () => {
  let service: ScheduleProgressCalculatorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ScheduleProgressCalculatorService],
    }).compile();

    service = module.get<ScheduleProgressCalculatorService>(
      ScheduleProgressCalculatorService,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('calculateAllSchedulesProgress', () => {
    it('should calculate progress for all schedules', () => {
      const history = [
        {
          id_programacao: 1,
          prog: 20,
          real: 10,
          servicos: {
            materiais: null,
          },
        },
        {
          id_programacao: 1,
          prog: 10,
          real: 5,
          servicos: {
            materiais: null,
          },
        },
        {
          id_programacao: 2,
          prog: 30,
          real: null,
          servicos: {
            materiais: null,
          },
        },
      ];

      const result = service.calculateAllSchedulesProgress(history, 100);

      expect(result).toEqual([
        {
          idProgramacao: 1,
          prog: 30,
          exec: 15,
        },
        {
          idProgramacao: 2,
          prog: 30,
          exec: null,
        },
      ]);
    });

    it('should ignore materials', () => {
      const history = [
        {
          id_programacao: 1,
          prog: 50,
          real: 20,
          servicos: {
            materiais: {
              descricao: 'POSTE',
            },
          },
        },
      ];

      const result = service.calculateAllSchedulesProgress(history, 100);

      expect(result).toEqual([]);
    });

    it('should ignore records with real equal zero', () => {
      const history = [
        {
          id_programacao: 1,
          prog: 50,
          real: 0,
          servicos: {
            materiais: null,
          },
        },
      ];

      const result = service.calculateAllSchedulesProgress(history, 100);

      expect(result).toEqual([]);
    });

    it('should return percentage zero when total planned is zero', () => {
      const history = [
        {
          id_programacao: 1,
          prog: 10,
          real: 5,
          servicos: {
            materiais: null,
          },
        },
      ];

      const result = service.calculateAllSchedulesProgress(history, 0);

      expect(result).toEqual([
        {
          idProgramacao: 1,
          prog: 0,
          exec: 0,
        },
      ]);
    });

    it('should aggregate multiple schedules correctly', () => {
      const history = [
        {
          id_programacao: 1,
          prog: 10,
          real: 5,
          servicos: {
            materiais: null,
          },
        },
        {
          id_programacao: 2,
          prog: 20,
          real: 10,
          servicos: {
            materiais: null,
          },
        },
      ];

      const result = service.calculateAllSchedulesProgress(history, 100);

      expect(result).toEqual([
        {
          idProgramacao: 1,
          prog: 10,
          exec: 5,
        },
        {
          idProgramacao: 2,
          prog: 20,
          exec: 10,
        },
      ]);
    });
  });

  describe('calculateScheduleProgress', () => {
    it('should return progress of requested schedule', () => {
      const history = [
        {
          id_programacao: 1,
          prog: 25,
          real: 10,
          servicos: {
            materiais: null,
          },
        },
      ];

      const result = service.calculateScheduleProgress(history, 100, 1);

      expect(result).toEqual({
        prog: 25,
        exec: 10,
      });
    });

    it('should return zero values when schedule does not exist', () => {
      const result = service.calculateScheduleProgress([], 100, 999);

      expect(result).toEqual({
        prog: 0,
        exec: 0,
      });
    });
  });

  describe('calculateAggregateProgress', () => {
    it('should calculate aggregate progress excluding one schedule', () => {
      const history = [
        {
          id_programacao: 1,
          prog: 20,
          real: 10,
          servicos: {
            materiais: null,
          },
        },
        {
          id_programacao: 2,
          prog: 40,
          real: 20,
          servicos: {
            materiais: null,
          },
        },
        {
          id_programacao: 3,
          prog: 40,
          real: null,
          servicos: {
            materiais: null,
          },
        },
      ];

      const result = service.calculateAggregateProgress(history, 100, 1);

      expect(result).toEqual({
        prog: 80,
        exec: 20,
      });
    });

    it('should ignore records with real equal zero', () => {
      const history = [
        {
          id_programacao: 1,
          prog: 20,
          real: 0,
          servicos: {
            materiais: null,
          },
        },
      ];

      const result = service.calculateAggregateProgress(history, 100, 999);

      expect(result).toEqual({
        prog: 0,
        exec: 0,
      });
    });

    it('should ignore materials', () => {
      const history = [
        {
          id_programacao: 1,
          prog: 50,
          real: 30,
          servicos: {
            materiais: {
              descricao: 'POSTE',
            },
          },
        },
      ];

      const result = service.calculateAggregateProgress(history, 100, 999);

      expect(result).toEqual({
        prog: 0,
        exec: 0,
      });
    });

    it('should cap values at 100 percent', () => {
      const history = [
        {
          id_programacao: 1,
          prog: 300,
          real: 200,
          servicos: {
            materiais: null,
          },
        },
      ];

      const result = service.calculateAggregateProgress(history, 100, 999);

      expect(result).toEqual({
        prog: 100,
        exec: 100,
      });
    });

    it('should return zero when total planned is zero', () => {
      const history = [
        {
          id_programacao: 1,
          prog: 100,
          real: 50,
          servicos: {
            materiais: null,
          },
        },
      ];

      const result = service.calculateAggregateProgress(history, 0, 999);

      expect(result).toEqual({
        prog: 0,
        exec: 0,
      });
    });
  });
});
