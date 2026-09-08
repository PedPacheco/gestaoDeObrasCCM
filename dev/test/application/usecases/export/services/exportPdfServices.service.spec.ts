import { ExportPdfServicesService } from 'src/application/usecases/export/services/exportPdfServices.service';
import { existsSync, readFileSync } from 'fs';
import PDFDocument from 'pdfkit';

const mockExistsSync = existsSync as jest.MockedFunction<typeof existsSync>;
const mockReadFileSync = readFileSync as jest.MockedFunction<
  typeof readFileSync
>;

const PDFDocumentMock = PDFDocument as unknown as jest.Mock;
const pdfDocumentInstance = {
  page: {
    width: 842,
    height: 595,
  },
  x: 0,
  y: 0,
  pipe: jest.fn(),
  addPage: jest.fn(),
  flushPages: jest.fn(),
  end: jest.fn(),
  rect: jest.fn(),
  fill: jest.fn(),
  image: jest.fn(),
  fillColor: jest.fn(),
  font: jest.fn(),
  fontSize: jest.fn(),
  text: jest.fn(),
  moveTo: jest.fn(),
  lineTo: jest.fn(),
  lineWidth: jest.fn(),
  stroke: jest.fn(),
  strokeColor: jest.fn(),
};

Object.values(pdfDocumentInstance).forEach((value) => {
  if (typeof value === 'function') {
    (value as jest.Mock).mockReturnValue(pdfDocumentInstance);
  }
});

jest.mock('pdfkit', () => {
  return jest.fn(() => pdfDocumentInstance);
});

jest.mock('fs', () => ({
  existsSync: jest.fn(),
  readFileSync: jest.fn(),
}));

jest.mock('moment', () => {
  const mockMoment: any = jest.fn(() => ({
    format: jest.fn(() => '10/08/2026'),
  }));

  mockMoment.utc = jest.fn(() => ({
    format: jest.fn(() => '10/08/2026'),
  }));

  return {
    __esModule: true,
    default: mockMoment,
  };
});

describe('ExportPdfServicesService', () => {
  let service: ExportPdfServicesService;

  const response = {} as any;

  const createServiceItem = (overrides = {}) => ({
    codigo: 'COD-001',
    descricao: 'Descrição do serviço',
    operacao: 'Operação teste',
    ponto: 'Ponto teste',
    prog: 50,
    real: 40,
    equipe: 'Equipe A',
    ...overrides,
  });

  const createData = (overrides = {}) => ({
    ovnota: 'OV-123',
    ordemDiagrama: 'OD-001',
    referencia: 'REF-001',
    tipo_obra: 'Melhoria',
    municipio: 'São José dos Campos',
    circuito: 'Circuito 01',
    conjunto: 'Conjunto A',
    parceira: 'Parceira X',
    empreendimento: 'Empreendimento Y',

    programacao: {
      data_prog: new Date('2026-08-10'),
      prog: 75,
      exec: 50,
      hora_ini: new Date(),
      hora_ter: new Date(),
      tipo_servico: 'Construção',
      observacao_programacao: 'Observação teste',
      equip_desligado: 'Equipamento X',
      chi: 123,
      num_dp: 'DP-001',
      chave_provisoria: true,
      equipe_linha_morta: 1,
      equipe_linha_viva: 2,
      equipe_regularizacao: 3,
    },

    servicos: [createServiceItem()],

    ...overrides,
  });

  beforeEach(() => {
    jest.clearAllMocks();

    Object.values(pdfDocumentInstance).forEach((value) => {
      if (typeof value === 'function') {
        (value as jest.Mock).mockReturnValue(pdfDocumentInstance);
      }
    });

    pdfDocumentInstance.page = {
      width: 842,
      height: 595,
    };

    service = new ExportPdfServicesService();
  });

  describe('export', () => {
    it('should export PDF successfully', async () => {
      mockExistsSync.mockReturnValue(true);

      mockReadFileSync
        .mockReturnValueOnce(Buffer.from('edp'))
        .mockReturnValueOnce(Buffer.from('sigo'));

      const data = [createData()];

      await service.export(data as any, response);

      expect(PDFDocumentMock).toHaveBeenCalledWith({
        size: 'A4',
        layout: 'landscape',
        margin: 40,
        bufferPages: true,
        autoFirstPage: true,
      });

      expect(pdfDocumentInstance.pipe).toHaveBeenCalledWith(response);

      expect(pdfDocumentInstance.flushPages).toHaveBeenCalled();

      expect(pdfDocumentInstance.end).toHaveBeenCalled();
    });

    it('should create a new page for multiple works', async () => {
      mockExistsSync.mockReturnValue(false);

      const data = [
        createData({
          ovnota: 'OV-001',
        }),
        createData({
          ovnota: 'OV-002',
        }),
      ];

      await service.export(data as any, response);

      expect(pdfDocumentInstance.addPage).toHaveBeenCalled();

      expect(pdfDocumentInstance.end).toHaveBeenCalled();
    });

    it('should continue when logos do not exist', async () => {
      mockExistsSync.mockReturnValue(false);

      await service.export([createData()] as any, response);

      expect(pdfDocumentInstance.image).not.toHaveBeenCalled();
    });

    it('should handle errors while reading logos', async () => {
      mockExistsSync.mockReturnValue(true);

      mockReadFileSync.mockImplementation(() => {
        throw new Error('Error reading file');
      });

      await service.export([createData()] as any, response);

      expect(pdfDocumentInstance.end).toHaveBeenCalled();
    });

    it('should render fallback values for nullable service fields', async () => {
      await service.export(
        [
          createData({
            servicos: [
              createServiceItem({
                codigo: null,
                descricao: null,
                operacao: null,
                ponto: null,
                prog: null,
              }),
            ],
          }),
        ] as any,
        response,
      );

      expect(pdfDocumentInstance.text).toHaveBeenCalled();
    });

    it('should render continuation header when page limit is reached', () => {
      pdfDocumentInstance.page.height = 200;

      const data = createData({
        servicos: Array.from({ length: 50 }, (_, i) =>
          createServiceItem({
            codigo: String(i),
          }),
        ),
      });

      (service as any).drawServicesTable(pdfDocumentInstance, data, 150);

      expect(pdfDocumentInstance.addPage).toHaveBeenCalled();

      expect(pdfDocumentInstance.text).toHaveBeenCalledWith(
        'SERVIÇOS E MATERIAIS (CONTINUAÇÃO)',
        40,
        70,
      );
    });
  });

  describe('drawHeader', () => {
    it('should use dash when service team is null', async () => {
      mockExistsSync.mockReturnValue(false);

      await service.export(
        [
          createData({
            servicos: [
              createServiceItem({
                equipe: null,
              }),
            ],
          }),
        ] as any,
        response,
      );

      expect(pdfDocumentInstance.text).toHaveBeenCalledWith(
        '-',
        expect.any(Number),
        expect.any(Number),
        expect.any(Object),
      );
    });
  });

  describe('drawWorkInformation', () => {
    it('should use fallback values for nullable work fields', async () => {
      await service.export(
        [
          createData({
            referencia: null,
            ordemDiagrama: null,
            empreendimento: null,
          }),
        ] as any,
        response,
      );

      expect(pdfDocumentInstance.text).toHaveBeenCalledWith(
        '-',
        expect.any(Number),
        expect.any(Number),
        expect.any(Object),
      );
    });
  });

  describe('drawProgrammingInformation', () => {
    it('should handle null programming', async () => {
      await service.export(
        [
          createData({
            programacao: null,
          }),
        ] as any,
        response,
      );

      expect(pdfDocumentInstance.end).toHaveBeenCalled();
    });

    it('should use fallback values for nullable programming fields', async () => {
      await service.export(
        [
          createData({
            programacao: {
              ...createData().programacao,
              tipo_servico: null,
              num_dp: null,
              observacao_programacao: null,
              chi: null,
            },
          }),
        ] as any,
        response,
      );

      expect(pdfDocumentInstance.text).toHaveBeenCalled();
    });

    it('should display "Não" when chave provisoria is false', async () => {
      await service.export(
        [
          createData({
            programacao: {
              ...createData().programacao,
              chave_provisoria: false,
            },
          }),
        ] as any,
        response,
      );

      expect(pdfDocumentInstance.text).toHaveBeenCalledWith(
        'Não',
        expect.any(Number),
        expect.any(Number),
        expect.any(Object),
      );
    });
  });

  describe('safeReadLogo', () => {
    it('should return the buffer when file exists', () => {
      const buffer = Buffer.from('logo');

      mockExistsSync.mockReturnValue(true);
      mockReadFileSync.mockReturnValue(buffer);

      const result = (service as any).safeReadLogo('/logo.png');

      expect(result).toEqual(buffer);

      expect(mockReadFileSync).toHaveBeenCalledWith('/logo.png');
    });

    it('should return null when file does not exist', () => {
      mockExistsSync.mockReturnValue(false);

      const result = (service as any).safeReadLogo('/logo.png');

      expect(result).toBeNull();
    });

    it('should return null when an error occurs', () => {
      mockExistsSync.mockImplementation(() => {
        throw new Error('File error');
      });

      const result = (service as any).safeReadLogo('/logo.png');

      expect(result).toBeNull();
    });
  });

  describe('sanitizeCell', () => {
    it.each([
      [null, '-'],
      [undefined, '-'],
      ['', '-'],
      ['   ', '-'],
      ['Texto\ncom\r\nquebra', 'Texto com quebra'],
      ['  Texto  ', 'Texto'],
    ])('should sanitize %p', (value, expected) => {
      const result = (service as any).sanitizeCell(value);

      expect(result).toBe(expected);
    });

    it('should return dash when value becomes empty after sanitization', () => {
      expect((service as any).sanitizeCell('\n\r\n\n')).toBe('-');
    });
  });

  describe('drawServicesTotal', () => {
    it('should draw total on the current page', () => {
      const data = createData({
        servicos: [createServiceItem(), createServiceItem()],
      });

      (service as any).drawServicesTotal(pdfDocumentInstance, data, 100, 30);

      expect(pdfDocumentInstance.addPage).not.toHaveBeenCalled();

      expect(pdfDocumentInstance.text).toHaveBeenCalledWith(
        'Total de itens: 2',
        40,
        108,
      );
    });

    it('should create a new page when total does not fit', () => {
      pdfDocumentInstance.page.height = 120;

      const data = createData({
        servicos: [createServiceItem()],
      });

      (service as any).drawServicesTotal(pdfDocumentInstance, data, 100, 30);

      expect(pdfDocumentInstance.addPage).toHaveBeenCalled();

      expect(pdfDocumentInstance.text).toHaveBeenCalledWith(
        'Total de itens: 1',
        40,
        40,
      );
    });
  });

  describe('drawFieldCard', () => {
    it('should draw card with value', () => {
      (service as any).drawFieldCard(
        pdfDocumentInstance,
        10,
        20,
        100,
        'LABEL',
        'VALUE',
      );

      expect(pdfDocumentInstance.rect).toHaveBeenCalledWith(10, 20, 100, 28);

      expect(pdfDocumentInstance.text).toHaveBeenCalledWith('LABEL', 16, 24);

      expect(pdfDocumentInstance.text).toHaveBeenCalledWith(
        'VALUE',
        16,
        34,
        expect.objectContaining({
          width: 88,
          lineBreak: false,
          ellipsis: true,
        }),
      );
    });

    it('should use fallback when value is empty', () => {
      (service as any).drawFieldCard(
        pdfDocumentInstance,
        10,
        20,
        100,
        'LABEL',
        '',
      );

      expect(pdfDocumentInstance.text).toHaveBeenCalledWith(
        '-',
        16,
        34,
        expect.any(Object),
      );
    });
  });
});
