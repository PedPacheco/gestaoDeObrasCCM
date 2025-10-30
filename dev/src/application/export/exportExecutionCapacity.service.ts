import * as ExcelJS from 'exceljs';
import { Response } from 'express';

import { Inject, Injectable } from '@nestjs/common';
import {
  EXPORT_REPOSITORY,
  IExportRepository,
} from 'src/domain/repositories/IExportRepository';

@Injectable()
export class ExportExecutionCapacityService {
  constructor(
    @Inject(EXPORT_REPOSITORY)
    private readonly exportRepository: IExportRepository,
  ) {}

  async export(response: Response) {
    const data = await this.exportRepository.exportExecutionCapacity();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Capacidade de execução');

    worksheet.columns = [
      { header: 'Ano', key: 'ano', width: 10 },
      { header: 'Regional', key: 'regional', width: 20 },
      { header: 'Parceira', key: 'turma', width: 10 },
      { header: 'Should Cost', key: 'total_shouldcost', width: 20 },
      { header: 'Qtd equipes RFP', key: 'total_qtde_equipes_rfp', width: 10 },
      { header: 'Janeiro', key: 'jan', width: 15 },
      { header: 'Financeiro JAN', key: 'financeiro_jan', width: 10 },
      { header: 'Fevereiro', key: 'fev', width: 15 },
      { header: 'Financeiro FEV', key: 'financeiro_fev', width: 10 },
      { header: 'Março', key: 'mar', width: 15 },
      { header: 'Financeiro MAR', key: 'financeiro_mar', width: 10 },
      { header: 'Abril', key: 'abr', width: 15 },
      { header: 'Financeiro ABR', key: 'financeiro_abr', width: 10 },
      { header: 'Maio', key: 'mai', width: 15 },
      { header: 'Financeiro MAI', key: 'financeiro_mai', width: 10 },
      { header: 'Junho', key: 'jun', width: 15 },
      { header: 'Financeiro JUN', key: 'financeiro_jun', width: 10 },
      { header: 'Julho', key: 'jul', width: 15 },
      { header: 'Financeiro JUL', key: 'financeiro_jul', width: 10 },
      { header: 'Agosto', key: 'ago', width: 15 },
      { header: 'Financeiro AGO', key: 'financeiro_ago', width: 10 },
      { header: 'Setembro', key: 'set', width: 15 },
      { header: 'Financeiro SET', key: 'financeiro_set', width: 10 },
      { header: 'Outubro', key: 'out', width: 15 },
      { header: 'Financeiro OUT', key: 'financeiro_out', width: 10 },
      { header: 'Novembro', key: 'nov', width: 15 },
      { header: 'Financeiro NOV', key: 'financeiro_nov', width: 10 },
      { header: 'Dezembro', key: 'dez', width: 15 },
      { header: 'Financeiro DEZ', key: 'financeiro_dez', width: 10 },
    ];

    const batchSize = 1000;

    const parsedData = data.map((row) => ({
      ...row,
      total_qtde_equipes_rfp:
        typeof row.total_qtde_equipes_rfp === 'bigint'
          ? Number(row.total_qtde_equipes_rfp)
          : row.total_qtde_equipes_rfp,
    }));

    for (let i = 0; i < parsedData.length; i += batchSize) {
      const batch = parsedData.slice(i, i + batchSize);
      worksheet.addRows(batch);
    }

    await workbook.xlsx.write(response);
  }
}
