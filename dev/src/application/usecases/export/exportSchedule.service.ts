import * as ExcelJS from 'exceljs';
import { Response } from 'express';

import { Injectable } from '@nestjs/common';

@Injectable()
export class ExportScheduleService {
  constructor() {}

  async export(scheduleData: any, response: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Programação');

    worksheet.columns = [
      { header: 'Ovnota', key: 'ovnota', width: 15 },
      { header: 'Ordem/Diagrama', key: 'ordemdiagrama', width: 20 },
      // { header: 'Restrição', key: 'restricao_aberta', width: 10 }, // novo
      { header: 'Ponto a Ponto', key: 'encontrado', width: 15 }, // novo
      { header: 'Municipio', key: 'mun', width: 10 },
      { header: 'Regional', key: 'regional', width: 15 }, // novo
      { header: 'Conjunto', key: 'conjunto', width: 20 },
      { header: 'Circuito', key: 'circuito', width: 15 },
      { header: 'Entrada', key: 'entrada', width: 15 },
      { header: 'Prazo final', key: 'prazo_fim', width: 15 },
      { header: 'Status prazo', key: 'status_prazo', width: 30 }, // novo
      { header: 'Status SAP', key: 'status_ov_sap', width: 10 }, // novo
      { header: 'Tipo da obra', key: 'tipo_obra', width: 25 },
      { header: 'Qtde planejada', key: 'qtde_planejada', width: 15 },
      { header: 'Qtde pendente', key: 'qtde_pend', width: 15 }, // novo
      {
        header: 'MO Programada (SAP)',
        key: 'mo_prog',
        width: 20,
        style: { numFmt: '"R$" #,##0.00' },
      },
      {
        header: 'MO executada (SAP)',
        key: 'mo_exec',
        width: 20,
        style: { numFmt: '"R$" #,##0.00' },
      }, // novo
      {
        header: 'MO programada (Ponto a Ponto)',
        key: 'moPlanejadaPontoAPonto',
        width: 25,
        style: { numFmt: '"R$" #,##0.00' },
      }, // novo
      {
        header: 'MO executada (Ponto a Ponto)',
        key: 'moExecutadoPontoAPonto',
        width: 25,
        style: { numFmt: '"R$" #,##0.00' },
      }, // novo
      { header: 'Material planejado', key: 'mat_prog', width: 10 },
      {
        header: 'Forecast serviço',
        key: 'mo_forecast',
        width: 20,
        style: { numFmt: '"R$" #,##0.00' },
      }, // novo
      {
        header: 'Forecast material',
        key: 'mat_forecast',
        width: 20,
        style: { numFmt: '"R$" #,##0.00' },
      }, // novo
      {
        header: 'Total forecast',
        key: 'forecast_total',
        width: 20,
        style: { numFmt: '"R$" #,##0.00' },
      }, // novo
      { header: 'Parceira', key: 'turma', width: 20 },
      { header: 'Status da obra', key: 'status', width: 30 }, // novo
      { header: 'Status da programação', key: 'status_programacao', width: 20 }, // novo
      {
        header: 'Executado da obra',
        key: 'executado',
        width: 20,
        style: { numFmt: '0.00"%"' },
      },
      {
        header: 'Data Programada',
        key: 'data_prog',
        width: 20,
        style: { numFmt: 'dd/mm/yyyy' },
      },
      {
        header: 'Programado',
        key: 'prog',
        width: 15,
        style: { numFmt: '0.00"%"' },
      },
      {
        header: 'Executado da programação',
        key: 'exec',
        width: 20,
        style: { numFmt: '0.00"%"' },
      },
      { header: 'Observação programação', key: 'equip_desligado', width: 50 },
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
        width: 25,
        style: { numFmt: 'hh:mm' },
      },
      { header: 'Equipe LM', key: 'equipe_linha_morta', width: 20 },
      { header: 'Equipe LV', key: 'equipe_linha_viva', width: 20 },
      {
        header: 'Equipe Regularização',
        key: 'equipe_regularizacao',
        width: 20,
      },
      { header: 'Técnico Responsável', key: 'tecnico', width: 20 },
    ];

    const batchSize = 1000;

    for (let i = 0; i < scheduleData.length; i += batchSize) {
      const batch = scheduleData.slice(i, i + batchSize);
      worksheet.addRows(batch);
    }

    await workbook.xlsx.write(response);
  }
}
