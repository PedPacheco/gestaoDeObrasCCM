import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import moment from 'moment';
import {
  EXPORT_REPOSITORY,
  IExportRepository,
} from 'src/domain/repositories/IExportRepository';

import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ExportFinedWorksService {
  constructor(
    @Inject(EXPORT_REPOSITORY)
    private readonly exportRepository: IExportRepository,
  ) {}

  async export(response: Response, startDate: string, endDate: string) {
    let start: Date | null;
    let end: Date | null;

    if (startDate && endDate) {
      start = moment(startDate).startOf('day').utc().toDate();
      end = moment(endDate).startOf('day').utc().toDate();
    }

    const data = await this.exportRepository.exportFinedWorks(start, end);

    const formattedData = data.map((row) => ({
      ovnota: row.obras.ovnota,
      ordem_dci: row.obras.ordem_dci,
      diagrama: row.obras.diagrama,
      regional: row.obras.municipios.regionais.regional,
      tipo_obra: row.obras.tipos.tipo_obra,
      turma: row.obras.turmas.turma,
      data_prog: row.data_prog,
      hora_ini: row.hora_ini,
      hora_ter: row.hora_ter,
      prog: row.prog,
      exec: row.exec,
      num_dp: row.num_dp,
      restricao: row.programacoes_restricao_execucao?.restricao ?? null,
      nome_responsavel_execucao: row.nome_responsavel_execucao,
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Programação');

    worksheet.columns = [
      { header: 'Ovnota', key: 'ovnota', width: 10 },
      { header: 'Diagrama', key: 'diagrama', width: 20 },
      { header: 'Ordem DCI', key: 'ordem_dci', width: 10 },
      { header: 'Regional', key: 'regional', width: 10 },
      { header: 'Parceira', key: 'turma', width: 20 },
      { header: 'Tipo da obra', key: 'tipo_obra', width: 20 },
      { header: 'Data Programada', key: 'data_prog', width: 10 },
      { header: 'Horário início', key: 'hora_ini', width: 15 },
      { header: 'Horário término', key: 'hora_ter', width: 10 },
      { header: 'Programado', key: 'prog', width: 10 },
      { header: 'Executado da programação', key: 'exec', width: 10 },
      { header: 'Número DP', key: 'num_dp', width: 15 },
      {
        header: 'Restrição',
        key: 'restricao',
        width: 20,
      },
      {
        header: 'Nome do Responsável',
        key: 'nome_responsavel_execucao',
        width: 15,
      },
    ];

    const batchSize = 1000;

    for (let i = 0; i < formattedData.length; i += batchSize) {
      const batch = formattedData.slice(i, i + batchSize);
      worksheet.addRows(batch);
    }

    await workbook.xlsx.write(response);
  }
}
