import * as ExcelJS from 'exceljs';
import { Response } from 'express';

import { Injectable } from '@nestjs/common';

@Injectable()
export class ExportD5NotesService {
  constructor() {}

  async export(data: any, response: Response) {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Notas D5');

    worksheet.columns = [
      { header: 'Nota D5', key: 'nota_d5', width: 15 },
      { header: 'Obra vinculada', key: 'obra', width: 20 },
      { header: 'Ordem/Diagrama', key: 'ordemDiagrama', width: 18 },
      { header: 'Tipo da obra', key: 'tipoObra', width: 30 },
      { header: 'Local instalação', key: 'local_instalacao', width: 18 },
      { header: 'Município', key: 'municipio', width: 20 },
      { header: 'Regional', key: 'regional', width: 12 },
      { header: 'Parceira', key: 'parceira', width: 15 },
      { header: 'Status D5 (SIGO)', key: 'status', width: 25 },
      { header: 'Status D5 (SAP)', key: 'status_sap', width: 18 },
      { header: 'Validação anual', key: 'validacao_anual', width: 15 },
      { header: 'MO Retida', key: 'moRetida', width: 15 },
      { header: 'Data de entrada', key: 'criado_em', width: 18 },
      { header: 'Data de conclusão', key: 'conclusao_nota', width: 18 },
      { header: 'Usuário modificador', key: 'usuarioModificador', width: 25 },
    ];

    const batchSize = 1000;

    for (let i = 0; i < data.d5Notes.length; i += batchSize) {
      const batch = data.d5Notes.slice(i, i + batchSize);
      worksheet.addRows(batch);
    }

    await workbook.xlsx.write(response);
  }
}
