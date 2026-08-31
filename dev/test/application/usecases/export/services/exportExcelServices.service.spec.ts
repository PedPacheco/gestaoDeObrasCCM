import * as ExcelJS from 'exceljs';
import { ExportExcelServicesService } from 'src/application/usecases/export/services/exportExcelServices.service';

// mocks compartilhados (fora do jest.mock)
const addRowsMock = jest.fn();
const addWorksheetMock = jest.fn();
const writeMock = jest.fn();

import { ExportServicesExcelOutput } from 'src/interface/types/servicesInterface';

export const exportServicesExcelMock: ExportServicesExcelOutput[] = [
  {
    ovnota: 'OV123456',
    ordemDiagrama: 'OD001',
    referencia: 'REF001',
    tipoObra: 'Rede Compacta',
    municipio: 'São Paulo',
    circuito: 'CIR001',
    conjunto: 'CONJ001',
    parceira: 'Parceira Alpha',
    empreendimento: 'Empreendimento Teste 1',
    dataProg: new Date('2026-08-01'),
    prog: 10,
    equipe: 'Equipe A',
    operacao: 'Instalação',
    ponto: 'PT001',
    codigo: 'COD001',
    descricao: 'Instalação de equipamento',
    quantidadeProgramada: 15,
    preco: 120.5,
  },
  {
    ovnota: 'OV654321',
    ordemDiagrama: 'OD002',
    referencia: 'REF002',
    tipoObra: 'Subterrânea',
    municipio: 'Campinas',
    circuito: 'CIR002',
    conjunto: 'CONJ002',
    parceira: 'Parceira Beta',
    empreendimento: 'Empreendimento Teste 2',
    dataProg: new Date('2026-08-02'),
    prog: 20,
    equipe: 'Equipe B',
    operacao: 'Manutenção',
    ponto: 'PT002',
    codigo: 'COD002',
    descricao: 'Troca de material',
    quantidadeProgramada: 30,
    preco: 89.99,
  },
];

jest.mock('exceljs', () => {
  return {
    Workbook: jest.fn().mockImplementation(() => ({
      addWorksheet: addWorksheetMock,
      xlsx: {
        write: writeMock,
      },
    })),
  };
});

describe('ExportExcelServicesService ', () => {
  let service: ExportExcelServicesService;
  let mockResponse: any;

  beforeEach(() => {
    service = new ExportExcelServicesService();

    mockResponse = {};

    addRowsMock.mockReset();
    writeMock.mockReset();

    addWorksheetMock.mockReturnValue({
      columns: [],
      addRows: addRowsMock,
    });

    writeMock.mockResolvedValue(undefined);
  });

  // ============================================================
  // 🚀 SUCESSO
  // ============================================================

  it('should create workbook, add worksheet, set columns and write response', async () => {
    await service.export(exportServicesExcelMock, mockResponse, true);

    expect(ExcelJS.Workbook).toHaveBeenCalled();

    expect(addWorksheetMock).toHaveBeenCalledWith('Serviços e Materiais');

    const worksheet = addWorksheetMock.mock.results[0].value;

    expect(worksheet.columns.length).toBeGreaterThan(0);

    expect(addRowsMock).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({
          ovnota: 'OV123456',
          ordemDiagrama: 'OD001',
        }),
      ]),
    );

    expect(writeMock).toHaveBeenCalledWith(mockResponse);
  });

  // ============================================================
  // 🔥 BATCHING
  // ============================================================

  it('should split data into batches of 1000', async () => {
    const data = Array.from({ length: 2500 }, (_, i) => ({
      ovnota: String(i),
    }));

    await service.export(
      data as ExportServicesExcelOutput[],
      mockResponse,
      true,
    );

    expect(addRowsMock).toHaveBeenCalledTimes(3);

    expect(addRowsMock.mock.calls[0][0].length).toBe(1000);
    expect(addRowsMock.mock.calls[1][0].length).toBe(1000);
    expect(addRowsMock.mock.calls[2][0].length).toBe(500);
  });

  // ============================================================
  // 📦 EDGE CASE
  // ============================================================

  it('should handle empty works array', async () => {
    await service.export([] as ExportServicesExcelOutput[], mockResponse, true);

    expect(addRowsMock).not.toHaveBeenCalled();
    expect(writeMock).toHaveBeenCalledWith(mockResponse);
  });

  // ============================================================
  // ⚠️ ERRO
  // ============================================================

  it('should throw error if write fails', async () => {
    writeMock.mockRejectedValueOnce(new Error('write error'));

    await expect(
      service.export(
        [{ ovnota: '1' }] as ExportServicesExcelOutput[],
        mockResponse,
        false,
      ),
    ).rejects.toThrow('write error');
  });

  // ============================================================
  // 🧠 COLUNAS
  // ============================================================

  it('should define worksheet columns correctly', async () => {
    await service.export(
      [] as ExportServicesExcelOutput[],
      mockResponse,
      false,
    );

    const worksheet = addWorksheetMock.mock.results[0].value;

    expect(worksheet.columns).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          header: 'OV/Nota',
          key: 'ovnota',
        }),
        expect.objectContaining({
          header: 'Ordem Diagrama',
          key: 'ordemDiagrama',
        }),
        expect.objectContaining({
          header: 'Data Programada',
          key: 'dataProg',
        }),
      ]),
    );
  });
});
