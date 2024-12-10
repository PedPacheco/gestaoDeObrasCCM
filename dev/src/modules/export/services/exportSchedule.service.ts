import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';

@Injectable()
export class ExportScheduleService {
  constructor() {}

  async export(scheduleData: any[], response: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Programação');

    worksheet.columns = [
      { header: 'Ovnota', key: 'ovnota', width: 10 },
      { header: 'Ordem/Diagrama', key: 'ordemdiagrama', width: 20 },
      { header: 'Municipio', key: 'mun', width: 10 },
      { header: 'Conjunto', key: 'conjunto', width: 20 },
      { header: 'Circuito', key: 'circuito', width: 10 },
      { header: 'Entrada', key: 'entrada', width: 15 },
      { header: 'Prazo final', key: 'prazo_fim', width: 10 },
      { header: 'Tipo da obra', key: 'tipo_obra', width: 20 },
      { header: 'Qtde planejada', key: 'qtde_planejada', width: 10 },
      { header: 'MO planejada', key: 'mo_planejada', width: 10 },
      { header: 'Parceira', key: 'turma', width: 20 },
      { header: 'Executado da obra', key: 'executado', width: 10 },
      { header: 'Data Programada', key: 'data_prog', width: 10 },
      { header: 'Programado', key: 'prog', width: 10 },
      { header: 'Executado da programação', key: 'exec', width: 10 },
      {
        header: 'Observação programação',
        key: 'observ_programacao',
        width: 50,
      },
      { header: 'Número DP', key: 'num_dp', width: 15 },
      { header: 'Horário início', key: 'hora_ini', width: 15 },
      { header: 'Horário término', key: 'hora_ter', width: 10 },
      { header: 'Equipe LM', key: 'equipe_linha_morta', width: 10 },
      { header: 'Equipe LV', key: 'equipe_linha_viva', width: 10 },
      {
        header: 'Equipe Regularização',
        key: 'equipe_regularizacao',
        width: 10,
      },
    ];

    const batchSize = 1000;

    for (let i = 0; i < scheduleData.length; i += batchSize) {
      const batch = scheduleData.slice(i, i + batchSize);
      worksheet.addRows(batch);
    }

    await workbook.xlsx.write(response);
  }
}
