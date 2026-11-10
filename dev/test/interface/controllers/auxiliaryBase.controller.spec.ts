import { HttpStatus, ParseIntPipe, RequestMethod } from '@nestjs/common';
import {
  GUARDS_METADATA,
  HTTP_CODE_METADATA,
  METHOD_METADATA,
  PATH_METADATA,
  ROUTE_ARGS_METADATA,
} from '@nestjs/common/constants';
import { RouteParamtypes } from '@nestjs/common/enums/route-paramtypes.enum';
import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';

import type { OperationType } from 'src/application/types';
import { AuxiliaryBaseController } from 'src/interface/controllers/auxiliaryBase.controller';
import { CONSTRUCTION_AREA_ID } from 'src/shared/costants';

// ─── Shared mock state (hoisted so the vi.mock factories can use it) ──
const h = vi.hoisted(() => {
  type GuardOptions = { allowedAreas: unknown[]; blockPartner?: boolean };

  class EditGuardStub {
    canActivate() {
      return true;
    }
  }
  class ViewGuardStub {
    canActivate() {
      return true;
    }
  }

  return {
    EditGuardStub,
    ViewGuardStub,
    areaEditGuard: vi.fn((_options: GuardOptions) => EditGuardStub),
    areaViewGuard: vi.fn((_options: GuardOptions) => ViewGuardStub),
  };
});

// The specifiers must match the source imports.
vi.mock('src/core/guards/newPermission.guard', () => ({
  AreaEditGuard: h.areaEditGuard,
  AreaViewGuard: h.areaViewGuard,
}));

vi.mock('src/application/usecases/auxiliaryBase/auxiliaryBase.service', () => ({
  AuxiliaryBaseService: class AuxiliaryBaseService {},
}));

// The guard factories run when the controller module is loaded (import time),
// so their calls are captured before any test runs.
const editGuardCalls = [...h.areaEditGuard.mock.calls];
const viewGuardCalls = [...h.areaViewGuard.mock.calls];

// ─── Helpers ────────────────────────────────────────────────────────
type Handler = Exclude<keyof AuxiliaryBaseController, 'constructor'>;

const GUARD_OPTIONS = {
  allowedAreas: [CONSTRUCTION_AREA_ID],
  blockPartner: true,
};

const OPERATION = 'insert' as unknown as OperationType;

const handlerMeta = (key: string, name: Handler) =>
  Reflect.getMetadata(key, AuxiliaryBaseController.prototype[name]);

const routeArgs = (name: Handler) =>
  Reflect.getMetadata(ROUTE_ARGS_METADATA, AuxiliaryBaseController, name) ?? {};

const ROUTES = [
  ['GetAuxiliaryBaseMarket', RequestMethod.GET, 'mercado', 'view'],
  ['GetAuxiliaryBaseNotes', RequestMethod.GET, 'notas', 'view'],
  ['InsertAuxiliaryBaseNotes', RequestMethod.POST, 'notas', 'edit'],
  ['InsertAuxiliaryBaseMarket', RequestMethod.POST, 'mercado', 'edit'],
  ['DeleteAuxiliaryBaseMarket', RequestMethod.DELETE, 'mercado/:id', 'edit'],
  [
    'DeleteAuxiliaryBaseMarketWithoutId',
    RequestMethod.DELETE,
    'mercado',
    'edit',
  ],
  ['DeleteAuxiliaryBaseNotes', RequestMethod.DELETE, 'notas/:id', 'edit'],
  ['DeleteAuxiliaryBaseNotesWithoutId', RequestMethod.DELETE, 'notas/', 'edit'],
] as const;

// ─── Suite ──────────────────────────────────────────────────────────
describe('AuxiliaryBaseController', () => {
  let service: {
    getMarket: Mock;
    getNotes: Mock;
    insertAuxiliaryBaseNotes: Mock;
    insertAuxiliaryBaseMarket: Mock;
    delete: Mock;
  };
  let controller: AuxiliaryBaseController;

  beforeEach(() => {
    service = {
      getMarket: vi.fn().mockResolvedValue([]),
      getNotes: vi.fn().mockResolvedValue([]),
      insertAuxiliaryBaseNotes: vi.fn().mockResolvedValue(undefined),
      insertAuxiliaryBaseMarket: vi.fn().mockResolvedValue(undefined),
      delete: vi.fn().mockResolvedValue(undefined),
    };
    controller = new AuxiliaryBaseController(service as never);
  });

  // ───────────────────────────────────────────────────────────────────
  describe('route metadata', () => {
    it('is mounted under /base-auxiliar', () => {
      expect(Reflect.getMetadata(PATH_METADATA, AuxiliaryBaseController)).toBe(
        'base-auxiliar',
      );
    });

    it('creates each guard once, restricted to the construction area and blocking partners', () => {
      expect(editGuardCalls).toEqual([[GUARD_OPTIONS]]);
      expect(viewGuardCalls).toEqual([[GUARD_OPTIONS]]);
    });

    it.each(ROUTES)(
      '%s is exposed as method %i on "%s"',
      (name, method, path) => {
        expect(handlerMeta(METHOD_METADATA, name)).toBe(method);
        expect(handlerMeta(PATH_METADATA, name)).toBe(path);
      },
    );

    it.each(ROUTES)('%s uses the %4$s guard', (name, _m, _p, guard) => {
      expect(handlerMeta(GUARDS_METADATA, name)).toEqual([
        guard === 'edit' ? h.EditGuardStub : h.ViewGuardStub,
      ]);
    });

    it.each(ROUTES)(
      '%s keeps the default Nest status code (200 for GET/DELETE, 201 for POST)',
      (name) => {
        expect(handlerMeta(HTTP_CODE_METADATA, name)).toBeUndefined();
      },
    );

    it('only the read routes use the view guard', () => {
      const viewRoutes = ROUTES.filter(([, , , guard]) => guard === 'view').map(
        ([name]) => name,
      );

      expect(viewRoutes).toEqual([
        'GetAuxiliaryBaseMarket',
        'GetAuxiliaryBaseNotes',
      ]);
    });

    describe('parameters', () => {
      it.each(['GetAuxiliaryBaseMarket', 'GetAuxiliaryBaseNotes'] as const)(
        '%s reads idRegional from the query string without pipes',
        (name) => {
          expect(routeArgs(name)).toEqual({
            [`${RouteParamtypes.QUERY}:0`]: expect.objectContaining({
              index: 0,
              data: 'idRegional',
              pipes: [],
            }),
          });
        },
      );

      it.each([
        'InsertAuxiliaryBaseNotes',
        'InsertAuxiliaryBaseMarket',
      ] as const)('%s reads the whole body', (name) => {
        expect(routeArgs(name)).toEqual({
          [`${RouteParamtypes.BODY}:0`]: expect.objectContaining({
            index: 0,
            data: undefined,
            pipes: [],
          }),
        });
      });

      it.each([
        'DeleteAuxiliaryBaseMarket',
        'DeleteAuxiliaryBaseNotes',
      ] as const)('%s parses the id route param with ParseIntPipe', (name) => {
        expect(routeArgs(name)).toEqual({
          [`${RouteParamtypes.PARAM}:0`]: expect.objectContaining({
            index: 0,
            data: 'id',
            pipes: [ParseIntPipe],
          }),
        });
      });

      it.each([
        'DeleteAuxiliaryBaseMarketWithoutId',
        'DeleteAuxiliaryBaseNotesWithoutId',
      ] as const)('%s has no parameters', (name) => {
        expect(routeArgs(name)).toEqual({});
      });
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('GetAuxiliaryBaseMarket', () => {
    it('returns the market values of the given region', async () => {
      const market = [{ id: 1 }, { id: 2 }];
      service.getMarket.mockResolvedValue(market);

      await expect(controller.GetAuxiliaryBaseMarket(3)).resolves.toEqual({
        statusCode: HttpStatus.OK,
        message: 'Valores retornados com sucesso',
        data: market,
      });
      expect(service.getMarket).toHaveBeenCalledTimes(1);
      expect(service.getMarket).toHaveBeenCalledWith(3);
    });

    it('passes undefined when no region is given', async () => {
      await controller.GetAuxiliaryBaseMarket();

      expect(service.getMarket).toHaveBeenCalledWith(undefined);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('GetAuxiliaryBaseNotes', () => {
    it('returns the notes of the given region', async () => {
      const notes = [{ nota: 'N1' }];
      service.getNotes.mockResolvedValue(notes);

      await expect(controller.GetAuxiliaryBaseNotes(5)).resolves.toEqual({
        statusCode: HttpStatus.OK,
        message: 'Valores das notas na base auxiliar retornadas com sucesso',
        data: notes,
      });
      expect(service.getNotes).toHaveBeenCalledTimes(1);
      expect(service.getNotes).toHaveBeenCalledWith(5);
    });

    it('passes undefined when no region is given', async () => {
      await controller.GetAuxiliaryBaseNotes();

      expect(service.getNotes).toHaveBeenCalledWith(undefined);
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('InsertAuxiliaryBaseNotes', () => {
    it('inserts the notes and returns the service result as "res"', async () => {
      const data = [{ nota: 'N1' }, { nota: 'N2' }] as never[];
      const result = { inserted: 2 };
      service.insertAuxiliaryBaseNotes.mockResolvedValue(result);

      await expect(
        controller.InsertAuxiliaryBaseNotes({ data, operation: OPERATION }),
      ).resolves.toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'Notas inseridas na base auxiliar com sucesso',
        res: result,
      });
      expect(service.insertAuxiliaryBaseNotes).toHaveBeenCalledTimes(1);
      expect(service.insertAuxiliaryBaseNotes).toHaveBeenCalledWith(
        data,
        OPERATION,
      );
    });

    it('forwards whatever the body contains, without validation (current behaviour)', async () => {
      await controller.InsertAuxiliaryBaseNotes({} as never);

      expect(service.insertAuxiliaryBaseNotes).toHaveBeenCalledWith(
        undefined,
        undefined,
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('InsertAuxiliaryBaseMarket', () => {
    it('inserts the market rows and does not expose the service result', async () => {
      const data = [{ ov: 'OV1' }] as never[];
      service.insertAuxiliaryBaseMarket.mockResolvedValue({ secret: true });

      const response = await controller.InsertAuxiliaryBaseMarket({
        data,
        operation: OPERATION,
      });

      expect(response).toEqual({
        statusCode: HttpStatus.CREATED,
        message: 'Obras de mercado inseridas na base auxiliar com sucesso',
      });
      expect(service.insertAuxiliaryBaseMarket).toHaveBeenCalledTimes(1);
      expect(service.insertAuxiliaryBaseMarket).toHaveBeenCalledWith(
        data,
        OPERATION,
      );
    });
  });

  // ───────────────────────────────────────────────────────────────────
  describe('delete routes', () => {
    it.each([
      [
        'DeleteAuxiliaryBaseMarket',
        [12],
        'baseOv',
        12,
        'Obra removida com sucesso',
      ],
      [
        'DeleteAuxiliaryBaseMarketWithoutId',
        [],
        'baseOv',
        undefined,
        'Obra removida com sucesso',
      ],
      [
        'DeleteAuxiliaryBaseNotes',
        [34],
        'baseNotes',
        34,
        'Nota removida com sucesso',
      ],
      [
        'DeleteAuxiliaryBaseNotesWithoutId',
        [],
        'baseNotes',
        undefined,
        'Nota removida com sucesso',
      ],
    ] as const)(
      '%s deletes from %3$s with id %4$s',
      async (name, args, table, id, message) => {
        const handler = controller[name] as (
          ...a: unknown[]
        ) => Promise<unknown>;

        await expect(handler.apply(controller, [...args])).resolves.toEqual({
          statusCode: HttpStatus.OK,
          message,
        });
        expect(service.delete).toHaveBeenCalledTimes(1);
        expect(service.delete).toHaveBeenCalledWith(table, id);
      },
    );
  });

  // ───────────────────────────────────────────────────────────────────
  describe('error propagation', () => {
    it.each([
      ['GetAuxiliaryBaseMarket', 'getMarket', [1]],
      ['GetAuxiliaryBaseNotes', 'getNotes', [1]],
      [
        'InsertAuxiliaryBaseNotes',
        'insertAuxiliaryBaseNotes',
        [{ data: [], operation: OPERATION }],
      ],
      [
        'InsertAuxiliaryBaseMarket',
        'insertAuxiliaryBaseMarket',
        [{ data: [], operation: OPERATION }],
      ],
      ['DeleteAuxiliaryBaseMarket', 'delete', [1]],
      ['DeleteAuxiliaryBaseMarketWithoutId', 'delete', []],
      ['DeleteAuxiliaryBaseNotes', 'delete', [1]],
      ['DeleteAuxiliaryBaseNotesWithoutId', 'delete', []],
    ] as const)(
      '%s rethrows the error of service.%s unchanged',
      async (name, method, args) => {
        const error = new Error(`${method} failed`);
        service[method].mockRejectedValueOnce(error);
        const handler = controller[name] as (
          ...a: unknown[]
        ) => Promise<unknown>;

        await expect(handler.apply(controller, [...args])).rejects.toBe(error);
      },
    );
  });
});
