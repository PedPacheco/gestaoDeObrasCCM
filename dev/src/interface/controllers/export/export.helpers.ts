import { Request, Response } from 'express';

export interface ExportRequest extends Request {
  idParceira?: number;
  insufficientPermission?: boolean;
  user: any;
}

export const XLSX_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export function applyPartnerFilters<
  T extends {
    idParceira?: number | number[];
    insufficientPermission?: boolean;
  },
>(filters: T, req: ExportRequest): T {
  if (req.idParceira) {
    filters.idParceira = req.idParceira;
  }
  if (req.user.tipo_usuario === 'PARCEIRA') {
    filters.insufficientPermission = true;
  }
  return filters;
}

export function setXlsxHeaders(res: Response, filename: string): void {
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.setHeader('Content-Type', XLSX_CONTENT_TYPE);
}

export function setPdfHeaders(res: Response, fileName: string): void {
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${fileName}.pdf"`,
  );
}
