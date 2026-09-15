import { BadRequestException, Logger } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { ImportServicesSpreadsheetService } from 'src/application/usecases/services/importServicesSpreadsheet.service';
import { QueriesServicesService } from 'src/application/usecases/services/queriesServices.service';

import {
  IWorkServicesRepository,
  WORK_SERVICES_REPOSITORY,
  ImportServiceItem,
  ParsedSpreadsheetItem,
} from 'src/domain/repositories/worksService/IWorkServicesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { SpreadsheetParserService } from 'src/infra/spreadsheet/spreadsheet.service';

// ─── Factories ────────────────────────────────────────────────

const makeParsedItem = (
  overrides: Partial<ParsedSpreadsheetItem> = {},
): ParsedSpreadsheetItem => ({
  type: 'service',
  point: 'P1',
  operation: 'OP1',
  operationNumber: '001',
  operationDescription: 'Instalação elétrica',
  materialCode: 'SRV-001',
  plannedQuantity: 10,
  ...overrides,
});

const makeFile = (
  overrides: Partial<Express.Multer.File> = {},
): Express.Multer.File =>
  ({
    buffer: Buffer.from('fake'),
    mimetype:
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ...overrides,
  }) as Express.Multer.File;

// ─── Mock builders ────────────────────────────────────────────

const buildMockRepository = (): jest.Mocked<IWorkServicesRepository> =>
  ({
    bulkImportItems: jest.fn().mockResolvedValue(undefined),
    // adicione outros métodos da interface se existirem
  }) as unknown as jest.Mocked<IWorkServicesRepository>;

const buildMockSpreadsheetParser = (): jest.Mocked<SpreadsheetParserService> =>
  ({
    parse: jest.fn(),
    dataStartRow: 2,
  }) as unknown as jest.Mocked<SpreadsheetParserService>;

const buildMockQueriesServices = (): jest.Mocked<QueriesServicesService> =>
  ({
    getServiceContracts: jest.fn().mockResolvedValue([]),
    getMaterials: jest.fn().mockResolvedValue([]),
  }) as unknown as jest.Mocked<QueriesServicesService>;

const buildMockPrisma = (): jest.Mocked<PrismaService> =>
  ({
    $transaction: jest.fn(async (cb: (tx: unknown) => Promise<void>) => {
      await cb({} as unknown);
    }),
  }) as unknown as jest.Mocked<PrismaService>;

// ─── Test Suite ───────────────────────────────────────────────

describe('ImportServicesSpreadsheetService', () => {
  let sut: ImportServicesSpreadsheetService;
  let repository: jest.Mocked<IWorkServicesRepository>;
  let spreadsheetParser: jest.Mocked<SpreadsheetParserService>;
  let queriesServices: jest.Mocked<QueriesServicesService>;
  let prisma: jest.Mocked<PrismaService>;

  beforeEach(async () => {
    repository = buildMockRepository();
    spreadsheetParser = buildMockSpreadsheetParser();
    queriesServices = buildMockQueriesServices();
    prisma = buildMockPrisma();

    // Silencia logs durante os testes
    jest.spyOn(Logger.prototype, 'log').mockImplementation();
    jest.spyOn(Logger.prototype, 'error').mockImplementation();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ImportServicesSpreadsheetService,
        { provide: WORK_SERVICES_REPOSITORY, useValue: repository },
        { provide: SpreadsheetParserService, useValue: spreadsheetParser },
        { provide: QueriesServicesService, useValue: queriesServices },
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    sut = module.get(ImportServicesSpreadsheetService);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  // ─── importFromSpreadsheet ────────────────────────────────

  describe('importFromSpreadsheet', () => {
    const workId = 1;

    it('should throw BadRequestException when spreadsheet has no valid items', async () => {
      spreadsheetParser.parse.mockResolvedValue({
        items: [],
        skippedRows: [],
      });

      await expect(
        sut.importFromSpreadsheet(workId, makeFile()),
      ).rejects.toThrow(BadRequestException);

      await expect(
        sut.importFromSpreadsheet(workId, makeFile()),
      ).rejects.toThrow(
        'Nenhum serviço ou material válido encontrado na planilha',
      );
    });

    it('should throw BadRequestException when all parsed items fail validation', async () => {
      spreadsheetParser.parse.mockResolvedValue({
        items: [makeParsedItem({ materialCode: 'UNKNOWN' })],
        skippedRows: [{ row: 1, reason: 'empty' }],
      });

      queriesServices.getServiceContracts.mockResolvedValue([]);
      queriesServices.getMaterials.mockResolvedValue([]);

      await expect(
        sut.importFromSpreadsheet(workId, makeFile()),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException with error details when all items fail (object body)', async () => {
      spreadsheetParser.parse.mockResolvedValue({
        items: [makeParsedItem({ materialCode: 'UNKNOWN' })],
        skippedRows: [],
      });

      queriesServices.getServiceContracts.mockResolvedValue([]);
      queriesServices.getMaterials.mockResolvedValue([]);

      try {
        await sut.importFromSpreadsheet(workId, makeFile());
        fail('Expected BadRequestException');
      } catch (error) {
        expect(error).toBeInstanceOf(BadRequestException);
        const response = (error as BadRequestException).getResponse();
        expect(response).toHaveProperty('message');
        expect(response).toHaveProperty('errors');
        expect(response).toHaveProperty('skippedRows');
        expect(response).toHaveProperty('totalErrors');
        expect(response).toHaveProperty('totalSkipped');
      }
    });

    it('should successfully import valid service items', async () => {
      spreadsheetParser.parse.mockResolvedValue({
        items: [makeParsedItem()],
        skippedRows: [],
      });

      queriesServices.getServiceContracts.mockResolvedValue([
        { id: 100, material: 'SRV-001' },
      ]);
      queriesServices.getMaterials.mockResolvedValue([]);

      const result = await sut.importFromSpreadsheet(workId, makeFile());

      expect(result.imported).toBe(1);
      expect(result.skipped).toBe(0);
      expect(result.errors).toHaveLength(0);
      expect(result.skippedRows).toHaveLength(0);
      expect(repository.bulkImportItems).toHaveBeenCalledTimes(1);
      expect(repository.bulkImportItems).toHaveBeenCalledWith(
        workId,
        [
          expect.objectContaining({
            idService: 100,
            type: 'service',
            point: 'P1',
          }),
        ],
        expect.anything(), // tx
      );
    });

    it('should successfully import valid material items', async () => {
      spreadsheetParser.parse.mockResolvedValue({
        items: [makeParsedItem({ type: 'material', materialCode: 'MAT-001' })],
        skippedRows: [],
      });

      queriesServices.getServiceContracts.mockResolvedValue([]);
      queriesServices.getMaterials.mockResolvedValue([
        { id: 200, codigo: 'MAT-001' },
      ]);

      const result = await sut.importFromSpreadsheet(workId, makeFile());

      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(0);
      expect(repository.bulkImportItems).toHaveBeenCalledWith(
        workId,
        [expect.objectContaining({ idService: 200, type: 'material' })],
        expect.anything(),
      );
    });

    it('should return mixed results with valid and invalid items', async () => {
      spreadsheetParser.parse.mockResolvedValue({
        items: [
          makeParsedItem({ materialCode: 'SRV-001' }),
          makeParsedItem({ materialCode: 'INVALID' }),
          makeParsedItem({ point: '', materialCode: 'SRV-001' }),
        ],
        skippedRows: [{ row: 10, reason: 'empty row' }],
      });

      queriesServices.getServiceContracts.mockResolvedValue([
        { id: 100, material: 'SRV-001' },
      ]);
      queriesServices.getMaterials.mockResolvedValue([]);

      const result = await sut.importFromSpreadsheet(workId, makeFile());

      expect(result.imported).toBe(1);
      // 2 errors (INVALID code + empty point) + 1 skippedRow
      expect(result.skipped).toBe(3);
      expect(result.errors).toHaveLength(2);
      expect(result.skippedRows).toHaveLength(1);
    });

    it('should pass transaction options to prisma.$transaction', async () => {
      spreadsheetParser.parse.mockResolvedValue({
        items: [makeParsedItem()],
        skippedRows: [],
      });

      queriesServices.getServiceContracts.mockResolvedValue([
        { id: 100, material: 'SRV-001' },
      ]);
      queriesServices.getMaterials.mockResolvedValue([]);

      await sut.importFromSpreadsheet(workId, makeFile());

      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function), {
        maxWait: 10000,
        timeout: 30000,
      });
    });

    it('should rethrow and log error when bulkImportItems fails inside transaction', async () => {
      const dbError = new Error('DB write failed');

      spreadsheetParser.parse.mockResolvedValue({
        items: [makeParsedItem()],
        skippedRows: [],
      });

      queriesServices.getServiceContracts.mockResolvedValue([
        { id: 100, material: 'SRV-001' },
      ]);
      queriesServices.getMaterials.mockResolvedValue([]);

      repository.bulkImportItems.mockRejectedValue(dbError);

      await expect(
        sut.importFromSpreadsheet(workId, makeFile()),
      ).rejects.toThrow('DB write failed');

      expect(Logger.prototype.error).toHaveBeenCalledWith(dbError);
    });

    it('should log the import summary on success', async () => {
      spreadsheetParser.parse.mockResolvedValue({
        items: [makeParsedItem()],
        skippedRows: [],
      });

      queriesServices.getServiceContracts.mockResolvedValue([
        { id: 100, material: 'SRV-001' },
      ]);
      queriesServices.getMaterials.mockResolvedValue([]);

      await sut.importFromSpreadsheet(workId, makeFile());

      expect(Logger.prototype.log).toHaveBeenCalledWith(
        expect.stringContaining(`Importação obra ${workId}`),
      );
    });
  });

  // ─── buildCatalogMaps (via importFromSpreadsheet) ─────────

  describe('buildCatalogMaps (indirect)', () => {
    it('should ignore services with null material', async () => {
      spreadsheetParser.parse.mockResolvedValue({
        items: [makeParsedItem({ materialCode: 'SRV-001' })],
        skippedRows: [],
      });

      queriesServices.getServiceContracts.mockResolvedValue([
        { id: 1, material: null },
        { id: 2, material: 'SRV-001' },
      ]);
      queriesServices.getMaterials.mockResolvedValue([]);

      const result = await sut.importFromSpreadsheet(1, makeFile());

      expect(result.imported).toBe(1);
      expect(repository.bulkImportItems).toHaveBeenCalledWith(
        1,
        [expect.objectContaining({ idService: 2 })],
        expect.anything(),
      );
    });

    it('should ignore materials with null codigo', async () => {
      spreadsheetParser.parse.mockResolvedValue({
        items: [makeParsedItem({ type: 'material', materialCode: 'MAT-X' })],
        skippedRows: [],
      });

      queriesServices.getServiceContracts.mockResolvedValue([]);
      queriesServices.getMaterials.mockResolvedValue([
        { id: 10, codigo: null },
        { id: 20, codigo: 'MAT-X' },
      ]);

      const result = await sut.importFromSpreadsheet(1, makeFile());

      expect(result.imported).toBe(1);
      expect(repository.bulkImportItems).toHaveBeenCalledWith(
        1,
        [expect.objectContaining({ idService: 20 })],
        expect.anything(),
      );
    });
  });

  // ─── validateAndResolveItems (via importFromSpreadsheet) ──

  describe('validateAndResolveItems (indirect)', () => {
    beforeEach(() => {
      queriesServices.getServiceContracts.mockResolvedValue([
        { id: 100, material: 'SRV-001' },
      ]);
      queriesServices.getMaterials.mockResolvedValue([
        { id: 200, codigo: 'MAT-001' },
      ]);
    });

    it('should report error when point is missing (empty string)', async () => {
      spreadsheetParser.parse.mockResolvedValue({
        items: [makeParsedItem({ point: '' })],
        skippedRows: [],
      });

      await expect(sut.importFromSpreadsheet(1, makeFile())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should report error when point is null/undefined', async () => {
      spreadsheetParser.parse.mockResolvedValue({
        items: [makeParsedItem({ point: undefined as unknown as string })],
        skippedRows: [],
      });

      await expect(sut.importFromSpreadsheet(1, makeFile())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should report error when operationDescription is missing', async () => {
      spreadsheetParser.parse.mockResolvedValue({
        items: [makeParsedItem({ operationDescription: '' })],
        skippedRows: [],
      });

      await expect(sut.importFromSpreadsheet(1, makeFile())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should report error when materialCode is missing', async () => {
      spreadsheetParser.parse.mockResolvedValue({
        items: [makeParsedItem({ materialCode: '' })],
        skippedRows: [],
      });

      await expect(sut.importFromSpreadsheet(1, makeFile())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should report error when materialCode is null/undefined', async () => {
      spreadsheetParser.parse.mockResolvedValue({
        items: [
          makeParsedItem({
            materialCode: undefined as unknown as string,
          }),
        ],
        skippedRows: [],
      });

      await expect(sut.importFromSpreadsheet(1, makeFile())).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should report error for unresolved service code', async () => {
      spreadsheetParser.parse.mockResolvedValue({
        items: [makeParsedItem({ type: 'service', materialCode: 'NOPE' })],
        skippedRows: [],
      });

      try {
        await sut.importFromSpreadsheet(1, makeFile());
        fail('Expected BadRequestException');
      } catch (error) {
        const response = (error as BadRequestException).getResponse() as any;
        expect(response.errors[0].message).toContain('serviços');
      }
    });

    it('should report error for unresolved material code', async () => {
      spreadsheetParser.parse.mockResolvedValue({
        items: [makeParsedItem({ type: 'material', materialCode: 'NOPE' })],
        skippedRows: [],
      });

      try {
        await sut.importFromSpreadsheet(1, makeFile());
        fail('Expected BadRequestException');
      } catch (error) {
        const response = (error as BadRequestException).getResponse() as any;
        expect(response.errors[0].message).toContain('materiais');
      }
    });

    it('should detect duplicate rows within the same spreadsheet', async () => {
      const item = makeParsedItem();

      spreadsheetParser.parse.mockResolvedValue({
        items: [item, { ...item }], // mesma combinação id + point + description
        skippedRows: [],
      });

      const result = await sut.importFromSpreadsheet(1, makeFile());

      expect(result.imported).toBe(1);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('duplicada');
    });

    it('should allow same materialCode with different point/description', async () => {
      spreadsheetParser.parse.mockResolvedValue({
        items: [
          makeParsedItem({ point: 'P1', operationDescription: 'Op A' }),
          makeParsedItem({ point: 'P2', operationDescription: 'Op A' }),
          makeParsedItem({ point: 'P1', operationDescription: 'Op B' }),
        ],
        skippedRows: [],
      });

      const result = await sut.importFromSpreadsheet(1, makeFile());

      expect(result.imported).toBe(3);
      expect(result.errors).toHaveLength(0);
    });

    it('should produce correct row numbers based on dataStartRow', async () => {
      spreadsheetParser.parse.mockResolvedValue({
        items: [
          makeParsedItem({ materialCode: 'BAD1' }),
          makeParsedItem({ materialCode: 'BAD2' }),
        ],
        skippedRows: [],
      });

      queriesServices.getServiceContracts.mockResolvedValue([]);
      queriesServices.getMaterials.mockResolvedValue([]);

      try {
        await sut.importFromSpreadsheet(1, makeFile());
        fail('Expected BadRequestException');
      } catch (error) {
        const response = (error as BadRequestException).getResponse() as any;
        // dataStartRow = 2, index 0 => row 2, index 1 => row 3
        expect(response.errors[0].row).toBe(2);
        expect(response.errors[1].row).toBe(3);
      }
    });

    it('should map all fields to ImportServiceItem correctly', async () => {
      const customItem = makeParsedItem({
        type: 'material',
        materialCode: 'MAT-001',
        point: 'PT-99',
        operation: 'OP-X',
        operationNumber: '042',
        operationDescription: 'Troca de cabo',
        plannedQuantity: 55,
      });

      spreadsheetParser.parse.mockResolvedValue({
        items: [customItem],
        skippedRows: [],
      });

      await sut.importFromSpreadsheet(1, makeFile());

      const expected: ImportServiceItem = {
        idService: 200,
        type: 'material',
        point: 'PT-99',
        operation: 'OP-X',
        operationNumber: '042',
        operationDescription: 'Troca de cabo',
        plannedQuantity: 55,
      };

      expect(repository.bulkImportItems).toHaveBeenCalledWith(
        1,
        [expected],
        expect.anything(),
      );
    });
  });

  // ─── Edge cases / limits ──────────────────────────────────

  describe('edge cases', () => {
    it('should truncate errors and skippedRows to 20 in the exception body', async () => {
      const items = Array.from({ length: 25 }, (_, i) =>
        makeParsedItem({ materialCode: `INVALID-${i}` }),
      );

      const skipped = Array.from({ length: 25 }, (_, i) => ({
        row: i,
        reason: `reason-${i}`,
      }));

      spreadsheetParser.parse.mockResolvedValue({
        items,
        skippedRows: skipped,
      });

      queriesServices.getServiceContracts.mockResolvedValue([]);
      queriesServices.getMaterials.mockResolvedValue([]);

      try {
        await sut.importFromSpreadsheet(1, makeFile());
        fail('Expected BadRequestException');
      } catch (error) {
        const response = (error as BadRequestException).getResponse() as any;
        expect(response.errors).toHaveLength(20);
        expect(response.skippedRows).toHaveLength(20);
        expect(response.totalErrors).toBe(25);
        expect(response.totalSkipped).toBe(25);
      }
    });

    it('should handle large import batches', async () => {
      const items = Array.from({ length: 500 }, (_, i) =>
        makeParsedItem({
          materialCode: 'SRV-001',
          point: `P-${i}`,
          operationDescription: `Desc-${i}`,
        }),
      );

      spreadsheetParser.parse.mockResolvedValue({
        items,
        skippedRows: [],
      });

      queriesServices.getServiceContracts.mockResolvedValue([
        { id: 100, material: 'SRV-001' },
      ]);
      queriesServices.getMaterials.mockResolvedValue([]);

      const result = await sut.importFromSpreadsheet(1, makeFile());

      expect(result.imported).toBe(500);
      expect(result.errors).toHaveLength(0);
    });
  });
});
