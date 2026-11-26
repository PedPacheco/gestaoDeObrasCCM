import * as Exceljs from 'exceljs';
import { Response } from 'express';

import { Injectable } from '@nestjs/common';
import { CompletedWorksRepositoryResponse } from 'src/domain/types';

@Injectable()
export class ExportCompletedWorksService {
  constructor() {}

  async export(
    worksData: CompletedWorksRepositoryResponse,
    response: Response,
  ) {
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
      { header: 'Tipo da obra', key: 'tipo_obra', width: 30 },
      { header: 'Qtde planejada', key: 'qtde_planejada', width: 15 },
      { header: 'Qtde pend', key: 'qtde_pend', width: 15 },
      { header: 'MO planejada', key: 'mo_planejada', width: 15 },
      { header: 'Status', key: 'status', width: 25 },
      { header: 'Parceira', key: 'turma', width: 15 },
      { header: 'Executado da obra', key: 'executado', width: 20 },
      { header: 'Data Execução', key: 'data_conclusao', width: 20 },
    ];

    const batchSize = 1000;

    for (let i = 0; i < worksData.works.length; i += batchSize) {
      const batch = worksData.works.slice(i, i + batchSize);
      worksheet.addRows(batch);
    }

    await workbook.xlsx.write(response);
  }
}
