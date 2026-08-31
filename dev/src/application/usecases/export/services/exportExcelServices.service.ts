import * as ExcelJS from 'exceljs';
import { Response } from 'express';

import { Injectable } from '@nestjs/common';
import { ExportServicesExcelOutput } from 'src/interface/types/servicesInterface';

@Injectable()
export class ExportExcelServicesService {
  constructor() {}

  async export(
    servicesData: ExportServicesExcelOutput[],
    response: Response,
    permission: boolean,
  ) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Serviços e Materiais');

      worksheet.columns = [
        { header: 'OV/Nota', key: 'ovnota', width: 15 },
        { header: 'Ordem Diagrama', key: 'ordemDiagrama', width: 18 },
        { header: 'Referência', key: 'referencia', width: 18 },
        { header: 'Tipo de Obra', key: 'tipoObra', width: 20 },
        { header: 'Município', key: 'municipio', width: 20 },
        { header: 'Circuito', key: 'circuito', width: 15 },
        { header: 'Conjunto', key: 'conjunto', width: 15 },
        { header: 'Parceira', key: 'parceira', width: 20 },
        { header: 'Empreendimento', key: 'empreendimento', width: 25 },
        {
          header: 'Data Programada',
          key: 'dataProg',
          width: 18,
          style: { numFmt: 'dd/mm/yyyy' },
        },
        { header: 'Prog.', key: 'prog', width: 10 },
        { header: 'Exec.', key: 'exec', width: 10 },
        {
          header: 'Hora Início',
          key: 'horaIni',
          width: 15,
          style: { numFmt: 'hh:mm' },
        },
        {
          header: 'Hora Término',
          key: 'horaTer',
          width: 15,
          style: { numFmt: 'hh:mm' },
        },
        { header: 'Equipe', key: 'equipe', width: 20 },
        { header: 'Operação', key: 'operacao', width: 20 },
        { header: 'Ponto', key: 'ponto', width: 15 },
        { header: 'Código', key: 'codigo', width: 15 },
        { header: 'Descrição', key: 'descricao', width: 60 },
        {
          header: 'Quantidade Programada',
          key: 'quantidadeProgramada',
          width: 22,
        },
        ...(permission
          ? [
              {
                header: 'Preço',
                key: 'preco',
                width: 10,
                style: {
                  numFmt: '"R$" #,##0.00',
                },
              },
            ]
          : []),
      ];

      const batchSize = 1000;

      for (let i = 0; i < servicesData.length; i += batchSize) {
        const batch = servicesData.slice(i, i + batchSize);
        worksheet.addRows(batch);
      }

      await workbook.xlsx.write(response);
    } catch (error) {
      throw error;
    }
  }
}
