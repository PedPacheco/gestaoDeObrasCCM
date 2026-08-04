// test/application/export/exportFinedWorks.service.spec.ts
import * as ExcelJS from 'exceljs';
import moment from 'moment';
import { Response } from 'express';
import { ExportFinedWorksService } from 'src/application/usecases/export/exportFinedWorks.service';
import { IExportRepository } from 'src/domain/contracts/IExportRepository';

jest.mock('exceljs', () => {
  const addRowsMock = jest.fn();
  const addWorksheetMock = jest.fn(() => {
    // Simula o worksheet retornado por addWorksheet
    return {
      columns: undefined,
      addRows: addRowsMock,
    };
  });
  const writeMock = jest.fn();
  const WorkbookMock = jest.fn(() => ({
    addWorksheet: addWorksheetMock,
    xlsx: { write: writeMock },
  }));

  return {
    Workbook: WorkbookMock,
  };
});

describe('ExportFinedWorksService', () => {
  let service: ExportFinedWorksService;
  let mockRepository: jest.Mocked<IExportRepository>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockRepository = {
      // apenas o método usado neste service
      exportFinedWorks: jest.fn(),
    } as unknown as jest.Mocked<IExportRepository>;

    service = new ExportFinedWorksService(mockRepository);
  });

  it('should call repository with start and end dates when provided and write excel', async () => {
    // Arrange
    const startDate = '2025-01-10';
    const endDate = '2025-01-15';

    // cria mock retornando um registro com nested structure
    const repoReturn = [
      {
        obras: {
          ovnota: 'OV001',
          ordem_dci: 'DCI1',
          diagrama: 'DIAG',
          municipios: { regionais: { regional: 'REG1' } },
          tipos: { tipo_obra: 'TIPO' },
          turmas: { turma: 'TURMA' },
        },
        data_prog: '2025-01-12T00:00:00.000Z',
        hora_ini: '1970-01-01T08:00:00.000Z',
        hora_ter: '1970-01-01T10:00:00.000Z',
        prog: 100,
        exec: 100,
        num_dp: 'DP123',
        programacoes_restricao_execucao: { restricao: 'RESTR' },
        nome_responsavel_execucao: 'Fulano',
      },
    ];
    mockRepository.exportFinedWorks.mockResolvedValue(repoReturn as any);

    const mockResponse = { setHeader: jest.fn() } as unknown as Response;

    // Act
    await service.export(mockResponse, startDate, endDate);

    // Assert

    // repository called with Date objects corresponding to startDate/endDate
    expect(mockRepository.exportFinedWorks).toHaveBeenCalledTimes(1);
    const calledWithStart = mockRepository.exportFinedWorks.mock
      .calls[0][0] as Date;
    const calledWithEnd = mockRepository.exportFinedWorks.mock
      .calls[0][1] as Date;

    const expectedStart = moment(startDate)
      .startOf('day')
      .utc()
      .toDate()
      .getTime();
    const expectedEnd = moment(endDate).startOf('day').utc().toDate().getTime();

    expect(calledWithStart.getTime()).toBe(expectedStart);
    expect(calledWithEnd.getTime()).toBe(expectedEnd);

    // Workbook usage assertions
    const workbookMock = (ExcelJS as any).Workbook as jest.Mock;
    expect(workbookMock).toHaveBeenCalledTimes(1);

    const workbookInstance = workbookMock.mock.results[0].value;
    expect(workbookInstance.addWorksheet).toHaveBeenCalledWith('Programação');

    // verify columns were set on worksheet
    const worksheet = workbookInstance.addWorksheet.mock.results[0].value;
    expect(Array.isArray(worksheet.columns)).toBeTruthy();

    // verify addRows called with formatted data
    const addRowsMock = worksheet.addRows as jest.Mock;
    expect(addRowsMock).toHaveBeenCalledTimes(1);

    // check the formatted object passed (mapping of nested fields)
    const rowsPassed = addRowsMock.mock.calls[0][0] as any[];
    expect(rowsPassed).toHaveLength(1);
    const formatted = rowsPassed[0];
    expect(formatted.ovnota).toBe('OV001');
    expect(formatted.ordem_dci).toBe('DCI1');
    expect(formatted.diagrama).toBe('DIAG');
    expect(formatted.regional).toBe('REG1');
    expect(formatted.tipo_obra).toBe('TIPO');
    expect(formatted.turma).toBe('TURMA');
    expect(formatted.data_prog).toBe('2025-01-12T00:00:00.000Z');
    expect(formatted.hora_ini).toBe('1970-01-01T08:00:00.000Z');
    expect(formatted.hora_ter).toBe('1970-01-01T10:00:00.000Z');
    expect(formatted.prog).toBe(100);
    expect(formatted.exec).toBe(100);
    expect(formatted.num_dp).toBe('DP123');
    expect(formatted.restricao).toBe('RESTR');
    expect(formatted.nome_responsavel_execucao).toBe('Fulano');

    // verify xlsx.write called with response
    expect(workbookInstance.xlsx.write).toHaveBeenCalledWith(mockResponse);
  });

  it('should call repository with undefined start/end when not provided and handle null restricao', async () => {
    // Arrange: return record where programacoes_restricao_execucao is undefined
    const repoReturn = [
      {
        obras: {
          ovnota: 'OV002',
          ordem_dci: 'DCI2',
          diagrama: null,
          municipios: { regionais: { regional: 'REG2' } },
          tipos: { tipo_obra: 'TIPO2' },
          turmas: { turma: 'TURMA2' },
        },
        data_prog: '2025-02-12T00:00:00.000Z',
        hora_ini: null,
        hora_ter: null,
        prog: 0,
        exec: null,
        num_dp: 'DP999',
        programacoes_restricao_execucao: undefined,
        nome_responsavel_execucao: null,
      },
    ];
    mockRepository.exportFinedWorks.mockResolvedValue(repoReturn as any);

    const mockResponse = { setHeader: jest.fn() } as unknown as Response;

    // Act: call without start/end
    await service.export(mockResponse, undefined as any, undefined as any);

    // Assert
    expect(mockRepository.exportFinedWorks).toHaveBeenCalledTimes(1);
    const calledWithStart = mockRepository.exportFinedWorks.mock.calls[0][0];
    const calledWithEnd = mockRepository.exportFinedWorks.mock.calls[0][1];
    expect(calledWithStart).toBeUndefined();
    expect(calledWithEnd).toBeUndefined();

    // Excel write assertions
    const workbookMock = (ExcelJS as any).Workbook as jest.Mock;
    const workbookInstance = workbookMock.mock.results[0].value;
    const worksheet = workbookInstance.addWorksheet.mock.results[0].value;
    const addRowsMock = worksheet.addRows as jest.Mock;

    expect(addRowsMock).toHaveBeenCalledTimes(1);

    const rowsPassed = addRowsMock.mock.calls[0][0] as any[];
    expect(rowsPassed[0].restricao).toBeNull(); // when undefined -> null
    expect(rowsPassed[0].nome_responsavel_execucao).toBeNull();
  });

  it('should chunk large data into batches (batch behavior) and call addRows multiple times', async () => {
    // Create data > batchSize to force multiple addRows calls
    // batchSize in service is 1000; create 1200 items
    const items: any[] = [];
    for (let i = 0; i < 1200; i++) {
      items.push({
        obras: {
          ovnota: `OV${i}`,
          ordem_dci: `OD${i}`,
          diagrama: null,
          municipios: { regionais: { regional: 'R' + i } },
          tipos: { tipo_obra: 'T' + i },
          turmas: { turma: 'TR' + i },
        },
        data_prog: null,
        hora_ini: null,
        hora_ter: null,
        prog: 0,
        exec: null,
        num_dp: null,
        programacoes_restricao_execucao: undefined,
        nome_responsavel_execucao: null,
      });
    }

    mockRepository.exportFinedWorks.mockResolvedValue(items as any);

    const mockResponse = { setHeader: jest.fn() } as unknown as Response;

    // Act
    await service.export(mockResponse, undefined, undefined);

    // Assert
    const workbookMock = (ExcelJS as any).Workbook as jest.Mock;
    const workbookInstance = workbookMock.mock.results[0].value;
    const worksheet = workbookInstance.addWorksheet.mock.results[0].value;
    const addRowsMock = worksheet.addRows as jest.Mock;

    // Should be called twice: 1000 + 200
    expect(addRowsMock).toHaveBeenCalledTimes(2);

    // Check sizes of batches passed
    const firstBatch = addRowsMock.mock.calls[0][0] as any[];
    const secondBatch = addRowsMock.mock.calls[1][0] as any[];
    expect(firstBatch.length).toBe(1000);
    expect(secondBatch.length).toBe(200);

    expect(workbookInstance.xlsx.write).toHaveBeenCalledWith(mockResponse);
  });
});
