import { CapexFullPipelineService } from 'src/application/usecases/auxiliaryBase/capex/capexFullPipeline.service';

describe('CapexFullPipelineService', () => {
  let service: CapexFullPipelineService;

  const mockProcessingService = {
    process: jest.fn(),
  };

  const mockUpdateService = {
    update: jest.fn(),
  };

  const mockLogger = {
    error: jest.fn(),
  };

  beforeEach(() => {
    service = new CapexFullPipelineService(
      mockProcessingService as any,
      mockUpdateService as any,
    );

    (service as any).logger = mockLogger;

    jest.clearAllMocks();
  });

  // ============================================================
  // 🚀 run()
  // ============================================================

  describe('run', () => {
    it('should execute processing and update in sequence', async () => {
      mockProcessingService.process.mockResolvedValue(undefined);
      mockUpdateService.update.mockResolvedValue(undefined);

      const emitter = jest.fn();

      await service.run('file.xlsx', 'job-1', emitter);

      expect(mockProcessingService.process).toHaveBeenCalled();
      expect(mockUpdateService.update).toHaveBeenCalled();

      // garante ordem
      expect(
        mockProcessingService.process.mock.invocationCallOrder[0],
      ).toBeLessThan(mockUpdateService.update.mock.invocationCallOrder[0]);
    });

    it('should pass remapped emitter to services', async () => {
      mockProcessingService.process.mockImplementation(
        async (_file, _job, emitter) => {
          emitter({
            phase: 'reading',
            percentage: 50,
            processed: 1,
            message: 'reading',
          });
        },
      );

      mockUpdateService.update.mockImplementation(async (emitter) => {
        emitter({
          phase: 'loading',
          percentage: 50,
          processed: 1,
          message: 'loading',
        });
      });

      const emitter = jest.fn();

      await service.run('file.xlsx', 'job-1', emitter);

      // reading 50% dentro de 0-20 => 10
      expect(emitter).toHaveBeenCalledWith(
        expect.objectContaining({ percentage: 10 }),
      );

      // loading 50% dentro de 45-65 => 55
      expect(emitter).toHaveBeenCalledWith(
        expect.objectContaining({ percentage: 55 }),
      );
    });

    it('should propagate error and log', async () => {
      const error = new Error('pipeline error');

      mockProcessingService.process.mockRejectedValue(error);

      const emitter = jest.fn();

      await expect(service.run('file.xlsx', 'job-1', emitter)).rejects.toThrow(
        'pipeline error',
      );

      expect(mockLogger.error).toHaveBeenCalledWith(
        expect.stringContaining('Erro no pipeline completo de CAPEX'),
        error.stack,
      );
    });
  });

  // ============================================================
  // 🧠 remapEmitter (private)
  // ============================================================

  describe('remapEmitter', () => {
    it('should remap percentage correctly', () => {
      const target = jest.fn();

      const emitter = (service as any).remapEmitter(target, {
        reading: { min: 0, max: 20 },
      });

      emitter({
        phase: 'reading',
        percentage: 50,
        processed: 1,
        message: 'test',
      });

      // 50% de 0-20 => 10
      expect(target).toHaveBeenCalledWith(
        expect.objectContaining({ percentage: 10 }),
      );
    });

    it('should return max when percentage is 100', () => {
      const target = jest.fn();

      const emitter = (service as any).remapEmitter(target, {
        reading: { min: 0, max: 20 },
      });

      emitter({
        phase: 'reading',
        percentage: 100,
        processed: 1,
        message: 'done',
      });

      expect(target).toHaveBeenCalledWith(
        expect.objectContaining({ percentage: 20 }),
      );
    });

    it('should pass through when phase is not mapped', () => {
      const target = jest.fn();

      const emitter = (service as any).remapEmitter(target, {});

      const payload = {
        phase: 'done',
        percentage: 100,
        processed: 1,
        message: 'done',
      };

      emitter(payload);

      expect(target).toHaveBeenCalledWith(payload);
    });

    it('should handle multiple ranges correctly', () => {
      const target = jest.fn();

      const emitter = (service as any).remapEmitter(target, {
        loading: { min: 45, max: 65 },
      });

      emitter({
        phase: 'loading',
        percentage: 25,
        processed: 1,
        message: 'loading',
      });

      // 25% de (45-65) => 45 + 5 = 50
      expect(target).toHaveBeenCalledWith(
        expect.objectContaining({ percentage: 50 }),
      );
    });

    it('should floor percentage values', () => {
      const target = jest.fn();

      const emitter = (service as any).remapEmitter(target, {
        processing: { min: 20, max: 45 },
      });

      emitter({
        phase: 'processing',
        percentage: 33,
        processed: 1,
        message: 'processing',
      });

      // valida arredondamento
      expect(target).toHaveBeenCalledWith(
        expect.objectContaining({
          percentage: Math.floor(20 + (33 / 100) * 25),
        }),
      );
    });
  });
});
