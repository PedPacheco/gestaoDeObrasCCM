import * as Exceljs from 'exceljs';
import { Injectable } from '@nestjs/common';
import { Response } from 'express';

@Injectable()
export class ExportCompletedWorksService {
  constructor() {}

  async export(worksData: any[], response: Response) {
    const workbook = new Exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Obras executadas');

    worksheet.columns = [
      { header: 'Ovnota', key: 'ovnota', width: 15 },
      { header: 'Ordem/Diagrama', key: 'ordemdiagrama', width: 15 },
      { header: 'Ordem DCD', key: 'ordem_dcd', width: 15 },
      { header: 'Ordem DCA', key: 'ordem_dca', width: 15 },
      { header: 'Ordem DCIM', key: 'ordem_dcim', width: 15 },
      { header: 'Status SAP', key: 'status_ov_sap', width: 10 },
      { header: 'PEP', key: 'pep', width: 10 },
      { header: 'Municipio', key: 'mun', width: 10 },
      { header: 'Regional', key: 'abrev_regional', width: 10 },
      { header: 'Conjunto', key: 'conjunto', width: 25 },
      { header: 'Circuito', key: 'circuito', width: 10 },
      { header: 'Entrada', key: 'entrada', width: 15 },
      { header: 'Prazo final', key: 'prazo_fim', width: 15 },
      { header: 'Tipo da obra', key: 'tipo_obra', width: 30 },
      { header: 'Qtde planejada', key: 'qtde_planejada', width: 15 },
      { header: 'Qtde pend', key: 'qtde_pend', width: 15 },
      { header: 'MO planejada', key: 'mo_planejada', width: 15 },
      { header: 'Status', key: 'status', width: 25 },
      { header: 'Parceira', key: 'turma', width: 15 },
      { header: 'Executado da obra', key: 'executado', width: 20 },
      { header: 'Data Programada', key: 'first_data_prog', width: 20 },
      { header: 'Programado', key: 'prog', width: 15 },
      { header: 'Executado da programação', key: 'exec', width: 20 },
      {
        header: 'Observação programação',
        key: 'observ_programacao',
        width: 70,
      },
      { header: 'CHI', key: 'chi', width: 10 },
      { header: 'Número DP', key: 'num_dp', width: 15 },
      {
        header: 'Horário início',
        key: 'hora_ini',
        width: 15,
        style: { numFmt: 'hh:mm' },
      },
      {
        header: 'Horário término',
        key: 'hora_ter',
        width: 15,
        style: { numFmt: 'hh:mm' },
      },
      { header: 'Equipe LM', key: 'equipe_linha_morta', width: 10 },
      { header: 'Equipe LV', key: 'equipe_linha_viva', width: 10 },
      {
        header: 'Equipe Regularização',
        key: 'equipe_regularizacao',
        width: 20,
      },
      { header: 'Data empreitamento', key: 'data_empreitamento', width: 20 },
      { header: 'Empreendimento', key: 'empreendimento', width: 25 },
    ];

    const batchSize = 1000;

    for (let i = 0; i < worksData.length; i += batchSize) {
      const batch = worksData.slice(i, i + batchSize);
      worksheet.addRows(batch);
    }

    await workbook.xlsx.write(response);
  }
}
