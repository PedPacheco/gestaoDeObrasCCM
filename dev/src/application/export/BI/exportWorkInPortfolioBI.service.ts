import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import {
  EXPORT_REPOSITORY,
  IExportRepository,
} from 'src/domain/repositories/IExportRepository';

import { Inject, Injectable } from '@nestjs/common';

@Injectable()
export class ExportWorksInPortfolioBI {
  constructor(
    @Inject(EXPORT_REPOSITORY)
    private readonly exportRepository: IExportRepository,
  ) {}

  async export(response: Response) {
    const data = await this.exportRepository.exportWorksInPortfolio();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('EXPORTACAO DADOS OBRAS');

    worksheet.columns = [
      { header: 'OVNOTA', key: 'ovnota', width: 15 },
      { header: 'PEP', key: 'pep', width: 10 },
      { header: 'ORDEMDIAGRAMA', key: 'ordemdiagrama', width: 15 },
      { header: 'ORDEMDCD', key: 'ordem_dcd', width: 15 },
      { header: 'ORDEMDCA', key: 'ordem_dca', width: 15 },
      { header: 'ORDEMDCIM', key: 'ordem_dcim', width: 15 },
      { header: 'MUN', key: 'mun', width: 10 },
      { header: 'REGIONAL', key: 'regional', width: 25 },
      { header: 'PRAZOFIM', key: 'prazofim', width: 15 },
      { header: 'ATRASO', key: 'atraso', width: 10 },
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
      { header: 'ENTRADA', key: 'entrada', width: 15 },
      { header: 'MínDeDATAPROG', key: 'min_data_prog', width: 15 },
      { header: 'MáxDeDATAPROG', key: 'max_data_prog', width: 15 },
      { header: 'STATUS', key: 'status', width: 25 },
      { header: 'CAPEXPLAN', key: 'capex_plan', width: 15 },
      { header: 'CAPEXPEND', key: 'capex_pend', width: 15 },
      { header: 'CAPEXMATPLAN', key: 'capex_mat_plan', width: 15 },
      { header: 'CAPEXMOPLAN', key: 'capex_mo_plan', width: 15 },
      { header: 'CAPEXMATPEND', key: 'capex_mat_pend', width: 15 },
      { header: 'CAPEXMOPEND', key: 'capex_mo_pend', width: 15 },
      {
        header: 'ContagemDeOcorrencias',
        key: 'contagem_de_ocorrencias',
        width: 15,
      },
      { header: 'HORAINI', key: 'hora_ini', width: 10 },
      { header: 'HORATER', key: 'hora_ter', width: 10 },
      { header: 'CONJUNTO', key: 'conjunto', width: 25 },
      { header: 'TIPOSERVICO', key: 'tipo_servico', width: 15 },
      { header: 'CHI', key: 'chi', width: 10 },
      {
        header: 'PrimeiroDeEQUIPELINHAMORTO',
        key: 'equipe_linha_morta',
        width: 10,
      },
      {
        header: 'PrimeiroDeEQUIPEREGULARIZACAO',
        key: 'equipe_regularizacao',
        width: 20,
      },
      {
        header: 'PrimeiroDeEQUIPELINHAVIVA',
        key: 'equipe_linha_viva',
        width: 10,
      },
      { header: 'NUMDP', key: 'num_dp', width: 15 },
      { header: 'GRUPO', key: 'grupo', width: 15 },
      { header: 'REFERENCIA', key: 'referencia', width: 15 },
      { header: 'DATAEMPREITAMENTO', key: 'data_empreitamento', width: 20 },
      { header: 'EMPREENDIMENTO', key: 'empreendimento', width: 25 },
      { header: 'DATAVIABILIDADE', key: 'data_viabilidade', width: 10 },
      { header: 'PRAZOVIABILIDADE', key: 'prazo_viabilidade', width: 20 },
    ];

    const batchSize = 1000;

    const parsedData = data.map((row) => ({
      ...row,
      contagem_de_ocorrencias:
        typeof row.contagem_de_ocorrencias === 'bigint'
          ? Number(row.contagem_de_ocorrencias)
          : row.contagem_de_ocorrencias,
    }));

    for (let i = 0; i < parsedData.length; i += batchSize) {
      const batch = parsedData.slice(i, i + batchSize);
      worksheet.addRows(batch);
    }

    await workbook.xlsx.write(response);
  }
}
