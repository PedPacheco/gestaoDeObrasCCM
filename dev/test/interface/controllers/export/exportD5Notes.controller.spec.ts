import { TestingModule } from '@nestjs/testing';
import { FindD5NotesService } from 'src/application/usecases/d5Notes/notes/findD5Notes.service';
import { FindD5SchedulesService } from 'src/application/usecases/d5Notes/schedules/findD5Schedules.service';
import { ExportD5NotesService } from 'src/application/usecases/export/exportD5Notes.service';
import { ExportD5NotesSchedulesService } from 'src/application/usecases/export/exportD5NotesSchedules.service';
import { ExportD5NotesController } from 'src/interface/controllers/export/exportD5.controller';
import {
  D5NotesFiltersDTO,
  D5NotesSchedulesFiltersDTO,
} from 'src/interface/dtos/d5NotesDTO';
import type { Mocked } from 'vitest';
import {
  assertXlsxHeaders,
  createExportTestingModule,
  makeMockResponse,
  makeReq,
  mockProvider,
} from './export.utils';

type FindD5NotesResult = Awaited<ReturnType<FindD5NotesService['get']>>;
type FindD5NotesSchedulesResult = Awaited<
  ReturnType<FindD5SchedulesService['findD5NotesSchedules']>
>;

const makeD5NotesResult = (
  overrides: Partial<FindD5NotesResult> = {},
): FindD5NotesResult =>
  ({
    d5Notes: [],
    totals: { totalProgramado: 0, totalExecutado: 0 },
    ...overrides,
  }) as FindD5NotesResult;

const makeD5NotesSchedulesResult = (
  overrides: Partial<FindD5NotesSchedulesResult> = {},
): FindD5NotesSchedulesResult =>
  ({
    d5Notes: [],
    totals: { totalProgramado: 0, totalExecutado: 0 },
    ...overrides,
  }) as FindD5NotesSchedulesResult;

describe('ExportD5NotesController', () => {
  let controller: ExportD5NotesController;
  let findD5NotesService: Mocked<FindD5NotesService>;
  let findD5NotesSchedulesService: Mocked<FindD5SchedulesService>;
  let exportD5NotesService: Mocked<ExportD5NotesService>;
  let exportD5NotesSchedulesService: Mocked<ExportD5NotesSchedulesService>;

  beforeEach(async () => {
    const module: TestingModule = await createExportTestingModule(
      ExportD5NotesController,
      [
        mockProvider(FindD5NotesService, ['get']),
        mockProvider(FindD5SchedulesService, ['findD5NotesSchedules']),
        mockProvider(ExportD5NotesService, ['export']),
        mockProvider(ExportD5NotesSchedulesService, ['export']),
      ],
    );

    controller = module.get(ExportD5NotesController);
    findD5NotesService = module.get(FindD5NotesService);
    findD5NotesSchedulesService = module.get(FindD5SchedulesService);
    exportD5NotesService = module.get(ExportD5NotesService);
    exportD5NotesSchedulesService = module.get(ExportD5NotesSchedulesService);
  });

  afterEach(() => vi.clearAllMocks());

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('exportD5Notes (GET /exportacao/notas-d5)', () => {
    it('should fetch notes, set xlsx headers and delegate to the export service', async () => {
      const res = makeMockResponse();
      const req = makeReq(); // INTERNO por defeito
      const filters = { regional: ['CEN'] } as unknown as D5NotesFiltersDTO;

      const result = makeD5NotesResult();
      findD5NotesService.get.mockResolvedValue(result);

      await controller.exportD5Notes(filters, res, req);

      expect(findD5NotesService.get).toHaveBeenCalledTimes(1);
      expect(findD5NotesService.get).toHaveBeenCalledWith(
        expect.objectContaining({ regional: ['CEN'] }),
      );
      assertXlsxHeaders(res, 'Exportação Notas D5');
      expect(exportD5NotesService.export).toHaveBeenCalledWith(result, res);
    });

    it('should scope the query to the partner when the user is PARCEIRA', async () => {
      const res = makeMockResponse();
      const req = makeReq({
        idParceira: 3,
        user: { tipo_usuario: 'PARCEIRA' },
      });

      findD5NotesService.get.mockResolvedValue(makeD5NotesResult());

      await controller.exportD5Notes({} as D5NotesFiltersDTO, res, req);

      expect(findD5NotesService.get).toHaveBeenCalledWith({
        idParceira: 3,
        insufficientPermission: true,
      });
    });

    it('should block the query when a PARCEIRA user has no partner binding', async () => {
      const res = makeMockResponse();
      const req = makeReq({ user: { tipo_usuario: 'PARCEIRA' } });

      findD5NotesService.get.mockResolvedValue(makeD5NotesResult());

      await controller.exportD5Notes({} as D5NotesFiltersDTO, res, req);

      expect(findD5NotesService.get).toHaveBeenCalledWith(
        expect.objectContaining({ insufficientPermission: true }),
      );
    });

    it('should set headers before writing the body', async () => {
      const res = makeMockResponse();
      findD5NotesService.get.mockResolvedValue(makeD5NotesResult());

      await controller.exportD5Notes({} as D5NotesFiltersDTO, res, makeReq());

      const headerOrder = res.setHeader.mock.invocationCallOrder[0];
      const exportOrder =
        exportD5NotesService.export.mock.invocationCallOrder[0];
      expect(headerOrder).toBeLessThan(exportOrder);
    });
  });

  describe('exportD5NotesSchedules (GET /exportacao/programacao/notas-d5)', () => {
    it('should fetch notes, set xlsx headers and delegate to the export service', async () => {
      const res = makeMockResponse();
      const req = makeReq(); // INTERNO por defeito
      const filters = {
        regional: ['CEN'],
      } as unknown as D5NotesSchedulesFiltersDTO;

      const result = makeD5NotesSchedulesResult();
      findD5NotesSchedulesService.findD5NotesSchedules.mockResolvedValue(
        result,
      );

      await controller.exportD5Schedules(filters, res, req);

      expect(
        findD5NotesSchedulesService.findD5NotesSchedules,
      ).toHaveBeenCalledTimes(1);
      expect(
        findD5NotesSchedulesService.findD5NotesSchedules,
      ).toHaveBeenCalledWith(expect.objectContaining({ regional: ['CEN'] }));
      assertXlsxHeaders(res, 'Exportação Programações Notas D5');
      expect(exportD5NotesSchedulesService.export).toHaveBeenCalledWith(
        result,
        res,
      );
    });

    it('should scope the query to the partner when the user is PARCEIRA', async () => {
      const res = makeMockResponse();
      const req = makeReq({
        idParceira: 3,
        user: { tipo_usuario: 'PARCEIRA' },
      });

      findD5NotesSchedulesService.findD5NotesSchedules.mockResolvedValue(
        makeD5NotesSchedulesResult(),
      );

      await controller.exportD5Schedules(
        {} as D5NotesSchedulesFiltersDTO,
        res,
        req,
      );

      expect(
        findD5NotesSchedulesService.findD5NotesSchedules,
      ).toHaveBeenCalledWith({
        idParceira: 3,
        insufficientPermission: true,
      });
    });

    it('should block the query when a PARCEIRA user has no partner binding', async () => {
      const res = makeMockResponse();
      const req = makeReq({ user: { tipo_usuario: 'PARCEIRA' } });

      findD5NotesSchedulesService.findD5NotesSchedules.mockResolvedValue(
        makeD5NotesSchedulesResult(),
      );

      await controller.exportD5Schedules(
        {} as D5NotesSchedulesFiltersDTO,
        res,
        req,
      );

      expect(
        findD5NotesSchedulesService.findD5NotesSchedules,
      ).toHaveBeenCalledWith(
        expect.objectContaining({ insufficientPermission: true }),
      );
    });

    it('should set headers before writing the body', async () => {
      const res = makeMockResponse();
      findD5NotesSchedulesService.findD5NotesSchedules.mockResolvedValue(
        makeD5NotesSchedulesResult(),
      );

      await controller.exportD5Schedules(
        {} as D5NotesSchedulesFiltersDTO,
        res,
        makeReq(),
      );

      const headerOrder = res.setHeader.mock.invocationCallOrder[0];
      const exportOrder =
        exportD5NotesSchedulesService.export.mock.invocationCallOrder[0];
      expect(headerOrder).toBeLessThan(exportOrder);
    });
  });
});
