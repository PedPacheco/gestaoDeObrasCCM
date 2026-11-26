import { Injectable } from '@nestjs/common';
import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import {
  D5NoteScheduleListItemOutput,
  D5SchedulesListOutput,
} from 'src/application/types';
// ajuste o caminho

const DATE_FMT = 'dd/mm/yyyy';
const TIME_FMT = 'hh:mm';
const DATETIME_FMT = 'dd/mm/yyyy hh:mm';

@Injectable()
export class ExportD5NotesSchedulesService {
  async export(data: D5SchedulesListOutput, response: Response): Promise<void> {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Programações Notas D5');

    worksheet.columns = [
      // Dados da nota
      { header: 'Nota D5', key: 'nota_d5', width: 15 },
      { header: 'OV/Nota', key: 'ovnota', width: 15 },
      { header: 'Ordem/Diagrama', key: 'ordemDiagrama', width: 18 },
      { header: 'Tipo da obra', key: 'tipo_obra', width: 30 },
      { header: 'Local instalação', key: 'local_instalacao', width: 18 },
      { header: 'Município', key: 'municipio', width: 20 },
      { header: 'Regional', key: 'regional', width: 12 },
      { header: 'Turma', key: 'turma', width: 15 },
      { header: 'Responsável', key: 'responsavel', width: 25 },
      { header: 'Status D5 (SIGO)', key: 'status', width: 25 },
      { header: 'Status D5 (SAP)', key: 'status_sap', width: 18 },
      { header: 'MO Retida', key: 'moRetida', width: 15 },
      {
        header: 'Data de entrada',
        key: 'criado_em',
        width: 18,
        style: { numFmt: DATETIME_FMT },
      },
      {
        header: 'Data de conclusão',
        key: 'conclusao_nota',
        width: 18,
        style: { numFmt: DATETIME_FMT },
      },

      // Dados da programação
      {
        header: 'Data programação',
        key: 'data_prog',
        width: 16,
        style: { numFmt: DATE_FMT },
      },
      {
        header: 'Hora início',
        key: 'hora_ini',
        width: 12,
        style: { numFmt: TIME_FMT },
      },
      {
        header: 'Hora término',
        key: 'hora_ter',
        width: 12,
        style: { numFmt: TIME_FMT },
      },
      { header: 'Programado', key: 'prog', width: 12 },
      { header: 'Executado', key: 'exec', width: 12 },
      { header: 'Equipe LM', key: 'equipe_lm', width: 11 },
      { header: 'Equipe LV', key: 'equipe_lv', width: 11 },
      { header: 'Equipe REG', key: 'equipe_reg', width: 11 },
      { header: 'Técnico', key: 'tecnico', width: 25 },
      { header: 'Tipo de serviço', key: 'tipo_servico', width: 20 },
      { header: 'Chave provisória', key: 'chave_provisoria', width: 16 },
      { header: 'CHI', key: 'chi', width: 10 },
      { header: 'Precisa DP', key: 'precisaDp', width: 12 },
      { header: 'Nº DP', key: 'num_dp', width: 15 },
      {
        header: 'Observação programação',
        key: 'observacao_programacao',
        width: 40,
      },
    ];

    // Cabeçalho em negrito, fixo e com filtro
    worksheet.getRow(1).font = { bold: true };
    worksheet.views = [{ state: 'frozen', ySplit: 1 }];
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: worksheet.columns.length },
    };

    for (const item of data.d5Notes ?? []) {
      worksheet.addRow(this.toRow(item));
    }

    await workbook.xlsx.write(response);
    response.end();
  }

  private toRow(item: D5NoteScheduleListItemOutput): Record<string, unknown> {
    return {
      nota_d5: item.nota_d5,
      ovnota: item.ovnota ?? '',
      ordemDiagrama: item.ordemDiagrama ?? '',
      tipo_obra: item.tipo_obra,
      local_instalacao: item.local_instalacao ?? '',
      municipio: item.municipio,
      regional: item.regional,
      turma: item.turma,
      responsavel: item.responsavel ?? '',
      status: item.status,
      status_sap: item.status_sap,
      moRetida: item.moRetida,
      criado_em: this.toExcelDate(item.criado_em),
      conclusao_nota: this.toExcelDate(item.conclusao_nota),

      data_prog: this.toExcelDate(item.data_prog),
      hora_ini: this.toExcelDate(item.hora_ini),
      hora_ter: this.toExcelDate(item.hora_ter),
      prog: item.prog,
      exec: item.exec ?? '',
      equipe_lm: item.equipe_lm,
      equipe_lv: item.equipe_lv,
      equipe_reg: item.equipe_reg,
      tecnico: item.tecnico ?? '',
      tipo_servico: item.tipo_servico ?? '',
      chave_provisoria: this.yesNo(item.chave_provisoria),
      chi: item.chi,
      precisaDp: this.yesNo(item.precisaDp),
      num_dp: item.num_dp ?? '',
      observacao_programacao: item.observacao_programacao ?? '',
    };
  }

  /**
   * O ExcelJS grava as datas em UTC. Este ajuste faz com que o Excel mostre
   * a hora local do servidor (por exemplo, 08:00 em vez de 11:00 em UTC-3).
   * Também aceita strings ISO, caso as datas cheguem já serializadas.
   */
  private toExcelDate(value: Date | string | null | undefined): Date | null {
    if (!value) return null;
    const d = value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) return null;
    return new Date(d.getTime() - d.getTimezoneOffset() * 60_000);
  }

  private yesNo(value: boolean | null | undefined): string {
    if (value === null || value === undefined) return '';
    return value ? 'Sim' : 'Não';
  }
}
