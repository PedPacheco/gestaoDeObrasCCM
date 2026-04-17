import * as ExcelJS from 'exceljs';
import { Response } from 'express';

import { Injectable } from '@nestjs/common';
import moment from 'moment';

@Injectable()
export class ExportPublicationRestrictionService {
  constructor() {}

  async export(publicationRestrictionData: any, response: Response) {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Restrições Publicação');

      const formattedData = publicationRestrictionData.works.map(
        (restriction) => ({
          ...restriction,
          criado_em: moment(restriction.criado_em)
            .utcOffset(-3)
            .format('DD/MM/YYYY HH:mm'),
          data_resolucao: moment(restriction.data_resolucao)
            .utcOffset(-3)
            .format('DD/MM/YYYY HH:mm'),
        }),
      );

      worksheet.columns = [
        { header: 'Ovnota', key: 'ovnota', width: 15 },
        { header: 'Diagrama', key: 'ordemdiagrama', width: 15 },
        { header: 'Municipio', key: 'mun', width: 20 },
        { header: 'Regional', key: 'regional', width: 20 },
        { header: 'Tipo da Obra', key: 'tipo_obra', width: 20 },
        { header: 'Status da Obra', key: 'status', width: 20 },
        { header: 'Parceira', key: 'parceira', width: 20 },
        { header: 'Total Executado', key: 'executado', width: 15 },
        {
          header: 'Data Conclusão',
          key: 'data_conclusao',
          width: 20,
          style: { numFmt: 'dd/mm/yyyy' },
        },
        { header: 'Restrição', key: 'restricao', width: 20 },
        { header: 'Responsabilidade', key: 'responsabilidade', width: 20 },
        { header: 'Nome do responsável', key: 'nome_responsavel', width: 20 },
        { header: 'Obersavação da publicação', key: 'observacao', width: 20 },
        {
          header: 'Obersavação da construção',
          key: 'observacao_construcao',
          width: 20,
        },
        {
          header: 'Status da Restrição',
          key: 'status_restricao',
          width: 20,
        },
        {
          header: 'Data de criação',
          key: 'criado_em',
          width: 20,
          style: { numFmt: 'dd/mm/yyyy hh:mm' },
        },
        {
          header: 'Data de resolução',
          key: 'data_resolucao',
          width: 20,
          style: { numFmt: 'dd/mm/yyyy hh:mm' },
        },
        {
          header: 'Criado por',
          key: 'nome_usuario',
          width: 20,
        },
      ];

      const batchSize = 1000;

      for (let i = 0; i < formattedData.length; i += batchSize) {
        const batch = formattedData.slice(i, i + batchSize);
        worksheet.addRows(batch);
      }

      await workbook.xlsx.write(response);
    } catch (error) {
      throw error;
    }
  }
}
