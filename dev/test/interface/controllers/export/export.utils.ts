import { Provider, Type } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Response } from 'express';

import {
  AreaEditGuard,
  AreaViewGuard,
} from 'src/core/guards/newPermission.guard';
import {
  ExportRequest,
  XLSX_CONTENT_TYPE,
} from 'src/interface/controllers/export/export.helpers';

// ─────────────────────────────────────────────
// Factories
// ─────────────────────────────────────────────

export function makeMockResponse(): jest.Mocked<Response> {
  return {
    setHeader: jest.fn(),
    send: jest.fn(),
  } as unknown as jest.Mocked<Response>;
}

/**
 * O `applyPartnerFilters` lê `req.user.tipo_usuario`, então `user` nunca pode
 * ser undefined. Por padrão o usuário é INTERNO; para simular parceira use
 * `makeReq({ user: { tipo_usuario: 'PARCEIRA' } })`.
 */
export function makeReq(
  overrides: {
    idParceira?: number;
    user?: { tipo_usuario?: string };
  } = {},
): ExportRequest {
  return {
    idParceira: overrides.idParceira,
    user: { tipo_usuario: 'INTERNO', ...overrides.user },
  } as unknown as ExportRequest;
}

// ─────────────────────────────────────────────
// Nest testing module
// ─────────────────────────────────────────────

/** Cria um provider mockado com `jest.fn()` para cada método informado. */
export function mockProvider<T>(
  token: Type<T>,
  methods: Array<keyof T & string>,
): Provider {
  return {
    provide: token,
    useValue: Object.fromEntries(methods.map((m) => [m, jest.fn()])),
  };
}

export function createExportTestingModule(
  controller: Type<unknown>,
  providers: Provider[],
): Promise<TestingModule> {
  return Test.createTestingModule({
    controllers: [controller],
    providers,
  })
    .overrideGuard(AreaViewGuard)
    .useValue({ canActivate: () => true })
    .overrideGuard(AreaEditGuard)
    .useValue({ canActivate: () => true })
    .compile();
}

// ─────────────────────────────────────────────
// Assertions
// ─────────────────────────────────────────────

export function assertXlsxHeaders(
  res: jest.Mocked<Response>,
  filename: string,
) {
  expect(res.setHeader).toHaveBeenCalledWith(
    'Content-Disposition',
    `attachment; filename="${filename}"`,
  );
  expect(res.setHeader).toHaveBeenCalledWith('Content-Type', XLSX_CONTENT_TYPE);
  expect(res.setHeader).toHaveBeenCalledTimes(2);
}

export function assertPdfHeaders(res: jest.Mocked<Response>, filename: string) {
  expect(res.setHeader).toHaveBeenCalledWith('Content-Type', 'application/pdf');
  expect(res.setHeader).toHaveBeenCalledWith(
    'Content-Disposition',
    `attachment; filename="${filename}.pdf"`,
  );
  expect(res.setHeader).toHaveBeenCalledTimes(2);
}
