import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';

import {
  ImportServiceItem,
  ParsedSpreadsheetItem,
  IWorkServicesRepository,
  WORK_SERVICES_REPOSITORY,
} from 'src/domain/repositories/worksService/IWorkServicesRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { SpreadsheetParserService } from 'src/infra/spreadsheet/spreadsheet.service';
import { QueriesServicesService } from './queriesServices.service';

export interface ImportResult {
  imported: number;
  skipped: number;
  errors: {
    row: number;
    message: string;
  }[];
  skippedRows: {
    row: number;
    reason: string;
  }[];
}

@Injectable()
export class ImportServicesSpreadsheetService {
  private readonly logger = new Logger(ImportServicesSpreadsheetService.name);

  constructor(
    @Inject(WORK_SERVICES_REPOSITORY)
    private readonly workServicesRepository: IWorkServicesRepository,
    private readonly workServicesQueriesServices: QueriesServicesService,
    private readonly spreadsheetParser: SpreadsheetParserService,
    private readonly prisma: PrismaService,
  ) {}

  async importFromSpreadsheet(
    workId: number,
    file: Express.Multer.File,
  ): Promise<ImportResult> {
    const { items: parsedItems, skippedRows } =
      await this.spreadsheetParser.parse(file.buffer, file.mimetype);

    if (parsedItems.length === 0) {
      throw new BadRequestException(
        'Nenhum serviço ou material válido encontrado na planilha',
      );
    }

    const [services, materials] = await Promise.all([
      this.workServicesQueriesServices.getServiceContracts(workId),
      this.workServicesQueriesServices.getMaterials(),
    ]);

    const { serviceCatalog, materialCatalog } = this.buildCatalogMaps(
      services,
      materials,
    );

    const { valid, errors } = this.validateAndResolveItems(
      parsedItems,
      serviceCatalog,
      materialCatalog,
    );

    if (valid.length === 0) {
      throw new BadRequestException({
        message: 'Nenhum item da planilha pôde ser importado.',
        errors: errors.slice(0, 20),
        skippedRows: skippedRows.slice(0, 20),
        totalErrors: errors.length,
        totalSkipped: skippedRows.length,
      });
    }

    await this.prisma.$transaction(
      async (tx) => {
        try {
          await this.workServicesRepository.bulkImportItems(workId, valid, tx);
        } catch (error) {
          this.logger.error(error);
          throw error;
        }
      },
      { maxWait: 10000, timeout: 30000 },
    );

    this.logger.log(
      `Importação obra ${workId}: ${valid.length} importados, ${errors.length} com erro`,
    );

    return {
      imported: valid.length,
      skipped: errors.length + skippedRows.length,
      errors,
      skippedRows,
    };
  }

  private buildCatalogMaps(
    services: { id: number; material: string | null }[],
    materials: { id: number; codigo: string | null }[],
  ) {
    const serviceCatalog = new Map<string, number>();
    const materialCatalog = new Map<string, number>();

    services.forEach((service) => {
      if (service.material) {
        serviceCatalog.set(service.material, service.id);
      }
    });

    materials.forEach((material) => {
      if (material.codigo) {
        materialCatalog.set(material.codigo, material.id);
      }
    });

    return { serviceCatalog, materialCatalog };
  }

  private validateAndResolveItems(
    items: ParsedSpreadsheetItem[],
    serviceCatalog: Map<string, number>,
    materialCatalog: Map<string, number>,
  ) {
    const valid: ImportServiceItem[] = [];
    const errors: { row: number; message: string }[] = [];
    const seenInFile = new Set<string>();

    items.forEach((item, index) => {
      const row = index + this.spreadsheetParser.dataStartRow;

      if (!item.point || !item.operationDescription) {
        errors.push({
          row,
          message: 'Ponto ou descrição da operação ausente.',
        });
        return;
      }

      if (!item.materialCode) {
        errors.push({ row, message: 'Código do material/serviço ausente.' });
        return;
      }

      const catalog =
        item.type === 'service' ? serviceCatalog : materialCatalog;
      const resolvedId = catalog.get(item.materialCode);

      if (!resolvedId) {
        const label = item.type === 'service' ? 'serviços' : 'materiais';
        errors.push({
          row,
          message: `Código "${item.materialCode}" não encontrado no catálogo de ${label}.`,
        });
        return;
      }

      const key = `${resolvedId}:${item.point}:${item.operationDescription}`;

      if (seenInFile.has(key)) {
        errors.push({ row, message: 'Linha duplicada dentro da planilha.' });
        return;
      }

      seenInFile.add(key);
      valid.push({
        idService: resolvedId,
        type: item.type,
        point: item.point,
        operation: item.operation,
        operationNumber: item.operationNumber,
        operationDescription: item.operationDescription,
        plannedQuantity: item.plannedQuantity,
      });
    });

    return { valid, errors };
  }
}
