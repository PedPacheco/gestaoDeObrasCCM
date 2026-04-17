import * as ExcelJS from 'exceljs';
import moment from 'moment';
import { ExportReportToPubliationService } from 'src/application/usecases/export/exportReportToPublication.service';
import { buildEquipamentosFormatados } from 'src/utils/buildFormattedEquipments';

jest.mock('src/utils/buildFormattedEquipments', () => ({
  buildEquipamentosFormatados: jest.fn(),
}));

jest.mock('exceljs', () => {
  const addRowsMock = jest.fn();
  const addWorksheetMock = jest.fn(() => ({
    columns: [],
    addRows: addRowsMock,
  }));

  const writeMock = jest.fn();

  return {
    Workbook: jest.fn().mockImplementation(() => ({
      addWorksheet: addWorksheetMock,
      xlsx: {
        write: writeMock,
      },
    })),
  };
});

describe('ExportReportToPubliationService', () => {
  let service: ExportReportToPubliationService;

  const mockRepository = {
    exportExecutionReport: jest.fn(),
  };

  const mockResponse = {} as any;

  let addRowsMock: jest.Mock;
  let addWorksheetMock: jest.Mock;
  let writeMock: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    addRowsMock = jest.fn();
    writeMock = jest.fn().mockResolvedValue(undefined);

    addWorksheetMock = jest.fn().mockReturnValue({
      columns: [],
      addRows: addRowsMock,
    });

    (ExcelJS.Workbook as jest.Mock).mockImplementation(() => ({
      addWorksheet: addWorksheetMock,
      xlsx: {
        write: writeMock,
      },
    }));

    (buildEquipamentosFormatados as jest.Mock).mockReturnValue('EQUIP_FORMAT');

    service = new ExportReportToPubliationService(mockRepository as any);
  });

  // ============================================================
  // 🚀 SUCESSO
  // ============================================================

  it('should format data, create workbook and write response', async () => {
    const mockData = [
      {
        id: 1,
        criado_em: '2026-04-17T12:00:00Z',
        usuario: { nome_usuario: 'Pedro' },
        obras: {
          ovnota: '123',
          diagrama: 'D1',
          ordem_dci: 'DCI',
          ordem_dca: 'DCA',
          ordem_dcd: 'DCD',
          ordem_dcim: 'DCIM',
          executado: true,
          entrada: '2026-04-01',
          prazo: 10,
          tipos: { tipo_obra: 'Tipo' },
          status: { status: 'OK' },
          turmas: { turma: 'Parceira' },
        },
        programacoes: {
          data_prog: new Date(),
        },
        instalacao_equipamento_aplicado: [],
        equipamentos_aplicados: [],
        potencia_equipamento_aplicado: [],
        patrimonio_equipamento_aplicado: [],
        instalacao_equipamento_retirado: [],
        equipamentos_retirados: [],
        potencia_equipamento_retirado: [],
        patrimonio_equipamento_retirado: [],
      },
    ];

    mockRepository.exportExecutionReport.mockResolvedValue(mockData);

    await service.export(mockResponse);

    expect(mockRepository.exportExecutionReport).toHaveBeenCalled();

    expect(ExcelJS.Workbook).toHaveBeenCalled();
    expect(addWorksheetMock).toHaveBeenCalledWith('Relatórios de execução');

    const worksheet = addWorksheetMock.mock.results[0].value;

    expect(worksheet.columns.length).toBeGreaterThan(0);

    expect(addRowsMock).toHaveBeenCalledTimes(1);

    const row = addRowsMock.mock.calls[0][0][0];

    expect(row).toMatchObject({
      id: 1,
      nome_usuario: 'Pedro',
      ovnota: '123',
      equipamentos_aplicados: 'EQUIP_FORMAT',
      equipamentos_retirados: 'EQUIP_FORMAT',
    });

    expect(row.criado_em).toBe(
      moment(mockData[0].criado_em).utcOffset(-3).format('DD/MM/YYYY HH:mm'),
    );

    expect(writeMock).toHaveBeenCalledWith(mockResponse);
  });

  // ============================================================
  // 🔥 BATCH
  // ============================================================

  it('should split data into batches of 1000', async () => {
    const mockData = Array.from({ length: 2500 }, (_, i) => ({
      id: i,
      criado_em: new Date(),
      usuario: {},
      obras: { entrada: new Date(), prazo: 1 },
      programacoes: {},
    }));

    mockRepository.exportExecutionReport.mockResolvedValue(mockData);

    await service.export(mockResponse);

    expect(addRowsMock).toHaveBeenCalledTimes(3);
    expect(addRowsMock.mock.calls[0][0].length).toBe(1000);
    expect(addRowsMock.mock.calls[1][0].length).toBe(1000);
    expect(addRowsMock.mock.calls[2][0].length).toBe(500);
  });

  // ============================================================
  // 📦 EDGE CASE
  // ============================================================

  it('should handle empty data', async () => {
    mockRepository.exportExecutionReport.mockResolvedValue([]);

    await service.export(mockResponse);

    expect(addRowsMock).not.toHaveBeenCalled();
    expect(writeMock).toHaveBeenCalled();
  });

  // ============================================================
  // 🧠 HELPER
  // ============================================================

  it('should call buildEquipamentosFormatados correctly', async () => {
    const mockData = [
      {
        id: 1,
        criado_em: new Date(),
        usuario: {},
        obras: { entrada: new Date(), prazo: 1 },
        programacoes: {},
        instalacao_equipamento_aplicado: [1],
        equipamentos_aplicados: [2],
        potencia_equipamento_aplicado: [3],
        patrimonio_equipamento_aplicado: [4],
        instalacao_equipamento_retirado: [5],
        equipamentos_retirados: [6],
        potencia_equipamento_retirado: [7],
        patrimonio_equipamento_retirado: [8],
      },
    ];

    mockRepository.exportExecutionReport.mockResolvedValue(mockData);

    await service.export(mockResponse);

    expect(buildEquipamentosFormatados).toHaveBeenCalledTimes(2);
  });

  // ============================================================
  // ⚠️ ERRO
  // ============================================================

  it('should throw if repository fails', async () => {
    mockRepository.exportExecutionReport.mockRejectedValue(
      new Error('repo error'),
    );

    await expect(service.export(mockResponse)).rejects.toThrow('repo error');
  });

  it('should throw if write fails', async () => {
    mockRepository.exportExecutionReport.mockResolvedValue([]);

    writeMock.mockRejectedValueOnce(new Error('write error'));

    await expect(service.export(mockResponse)).rejects.toThrow('write error');
  });
});
