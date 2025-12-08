import { Inject, Injectable } from '@nestjs/common';
import { Response } from 'express';
import * as ExcelJS from 'exceljs';
import {
  EXPORT_REPOSITORY,
  IExportRepository,
} from 'src/domain/repositories/IExportRepository';

@Injectable()
export class ExportCompletedWorksBIService {
  constructor(
    @Inject(EXPORT_REPOSITORY)
    private readonly exportRepository: IExportRepository,
  ) {}

  async export(res: Response) {
    const data = await this.exportRepository.exportCompletedWorks();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('EXPORTACAO DADOS OBRAS');

    worksheet.columns = [
      { header: 'OVNOTA', key: 'ovnota', width: 15 },
      { header: 'PEP', key: 'pep', width: 10 },
      { header: 'ORDEMDIAGRAMA', key: 'ordemdiagrama', width: 15 },
      { header: 'ORDEMDCD', key: 'ordem_dcd', width: 15 },
      { header: 'ORDEMDCA', key: 'ordem_dca', width: 15 },
      { header: 'ORDEMDCIM', key: 'ordem_dcim', width: 15 },
      { header: 'REGIONAL', key: 'abrev_regional', width: 10 },
      { header: 'MUN', key: 'mun', width: 10 },
      { header: 'ENTRADA', key: 'entrada', width: 15 },
      { header: 'DATACONCLUSAO', key: 'data_conclusao', width: 15 },
      { header: 'TIPOOBRA', key: 'tipo_obra', width: 30 },
      { header: 'QTDEPLANEJADA', key: 'qtde_planejada', width: 15 },
      { header: 'QTDEPEND', key: 'qtde_pend', width: 15 },
      { header: 'CIRCUITO', key: 'circuito', width: 10 },
      { header: 'MOPLANEJADA', key: 'mo_planejada', width: 15 },
      { header: 'MOEXEC', key: 'mo_exec', width: 15 },
      { header: 'MOSUSPENSA', key: 'mo_suspensa', width: 15 },
      {
        header: 'OBSERVOBRA',
        key: 'equip_desligado',
        width: 70,
      },
      { header: 'TURMA', key: 'turma', width: 15 },
      { header: '%EXECUTADO', key: 'executado', width: 20 },
      { header: 'STATUS', key: 'status', width: 25 },
      { header: 'CAPEXPLAN', key: 'capex_plan', width: 15 },
      { header: 'CAPEXPEND', key: 'capex_pend', width: 15 },
      { header: 'CAPEXMATPLAN', key: 'capex_mat_plan', width: 15 },
      { header: 'CAPEXMOPLAN', key: 'capex_mo_plan', width: 15 },
      { header: 'CAPEXMATPEND', key: 'capex_mat_pend', width: 15 },
      { header: 'CAPEXMOPEND', key: 'capex_mo_pend', width: 15 },
      { header: 'CONJUNTO', key: 'conjunto', width: 25 },
      { header: 'DATAEMPREITAMENTO', key: 'data_empreitamento', width: 20 },
      { header: 'DATAVIABILIDADE', key: 'data_viabilidade', width: 10 },
      { header: 'PRAZOVIABILIDADE', key: 'prazo_viabilidade', width: 20 },
    ];

    const batchSize = 1000;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      worksheet.addRows(batch);
    }

    await workbook.xlsx.write(res);
  }
}
