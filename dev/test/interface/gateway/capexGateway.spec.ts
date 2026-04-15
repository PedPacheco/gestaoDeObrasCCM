import { CapexPhase } from 'src/application/shared/capex.types';
import { CapexGateway } from 'src/interface/gateway/capex/capex.gateway';

describe('CapexGateway', () => {
  let gateway: CapexGateway;

  const mockEmit = jest.fn();

  const mockServer = {
    to: jest.fn().mockReturnValue({
      emit: mockEmit,
    }),
  };

  const mockClient = {
    id: 'client-1',
    join: jest.fn(),
    emit: jest.fn(),
  };

  const mockLogger = {
    debug: jest.fn(),
  };

  beforeEach(() => {
    jest.useFakeTimers();

    gateway = new CapexGateway();

    (gateway as any).server = mockServer;
    (gateway as any).logger = mockLogger;

    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  // ============================================================
  // 🔌 Lifecycle
  // ============================================================

  it('should handle connection', () => {
    gateway.handleConnection(mockClient as any);

    expect(mockLogger.debug).toHaveBeenCalledWith(
      expect.stringContaining('WS conectado'),
    );
  });

  it('should handle disconnect', () => {
    gateway.handleDisconnect(mockClient as any);

    expect(mockLogger.debug).toHaveBeenCalledWith(
      expect.stringContaining('WS desconectado'),
    );
  });

  // ============================================================
  // 🚪 Join
  // ============================================================

  it('should join room without cache', () => {
    gateway.handleJoin('job-1', mockClient as any);

    expect(mockClient.join).toHaveBeenCalledWith('job-1');
    expect(mockClient.emit).not.toHaveBeenCalled();
  });

  it('should replay cached state on join', () => {
    const event = {
      jobId: 'job-1',
      phase: 'loading',
      percentage: 10,
      processed: 1,
      message: 'test',
    };

    (gateway as any).jobCache.set('job-1', {
      lastState: event,
    });

    gateway.handleJoin('job-1', mockClient as any);

    expect(mockClient.emit).toHaveBeenCalledWith('capex:progress', event);
  });

  // ============================================================
  // 📡 emitProgress
  // ============================================================

  it('should emit progress and update cache', () => {
    const payload = {
      phase: 'loading' as CapexPhase,
      percentage: 20,
      processed: 2,
      message: 'test',
    };

    gateway.emitProgress('job-1', payload);

    expect(mockServer.to).toHaveBeenCalledWith('job-1');
    expect(mockEmit).toHaveBeenCalledWith('capex:progress', {
      jobId: 'job-1',
      ...payload,
    });

    const cache = (gateway as any).jobCache.get('job-1');

    expect(cache.lastState).toMatchObject(payload);
  });

  // ============================================================
  // 🧠 createEmitter
  // ============================================================

  it('should create emitter bound to jobId', () => {
    const emitter = gateway.createEmitter('job-1');

    const payload = {
      phase: 'loading' as CapexPhase,
      percentage: 10,
      processed: 1,
      message: 'test',
    };

    emitter(payload);

    expect(mockEmit).toHaveBeenCalledWith(
      'capex:progress',
      expect.objectContaining({
        jobId: 'job-1',
      }),
    );
  });

  // ============================================================
  // 🧹 Cache behavior
  // ============================================================

  it('should overwrite cache and clear previous timer', () => {
    const clearSpy = jest.spyOn(global, 'clearTimeout');

    const firstTimer = setTimeout(() => {}, 1000);

    (gateway as any).jobCache.set('job-1', {
      lastState: {} as any,
      cleanupTimer: firstTimer,
    });

    gateway.emitProgress('job-1', {
      phase: 'loading',
      percentage: 10,
      processed: 1,
      message: 'test',
    });

    expect(clearSpy).toHaveBeenCalledWith(firstTimer);
  });

  it('should schedule cleanup on done', () => {
    gateway.emitProgress('job-1', {
      phase: 'done',
      percentage: 100,
      processed: 10,
      message: 'done',
    });

    expect((gateway as any).jobCache.has('job-1')).toBe(true);

    jest.advanceTimersByTime(10 * 60 * 1000);

    expect((gateway as any).jobCache.has('job-1')).toBe(false);
  });

  it('should schedule cleanup on error', () => {
    gateway.emitProgress('job-1', {
      phase: 'error',
      percentage: 0,
      processed: 0,
      message: 'error',
    });

    jest.advanceTimersByTime(10 * 60 * 1000);

    expect((gateway as any).jobCache.has('job-1')).toBe(false);
  });

  // ============================================================
  // 🔁 Edge cases
  // ============================================================

  it('should not cleanup if phase is not done or error', () => {
    gateway.emitProgress('job-1', {
      phase: 'loading',
      percentage: 50,
      processed: 5,
      message: 'loading',
    });

    jest.advanceTimersByTime(10 * 60 * 1000);

    expect((gateway as any).jobCache.has('job-1')).toBe(true);
  });
});
