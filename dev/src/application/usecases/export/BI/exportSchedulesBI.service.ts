import { Inject, Injectable } from '@nestjs/common';
import { Response } from 'express';
import {
  EXPORT_REPOSITORY,
  IExportRepository,
} from 'src/domain/contracts/IExportRepository';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ExportSchedulesBIService {
  constructor(
    @Inject(EXPORT_REPOSITORY)
    private readonly exportRepository: IExportRepository,
  ) {}

  async export(res: Response) {
    const data = await this.exportRepository.exportSchedules();

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('EXTRACAO DAS PROGRAMACOES E RES');

    worksheet.columns = [
      { header: 'OVNOTA', key: 'ovnota', width: 10 },
      { header: 'PEP', key: 'pep', width: 10 },
      { header: 'ORDEMDIAGRAMA', key: 'ordemdiagrama', width: 20 },
      { header: 'ORDEMDCD', key: 'ordem_dcd', width: 20 },
      { header: 'ORDEMDCA', key: 'ordem_dca', width: 20 },
      { header: 'ORDEMDCIM', key: 'ordem_dcim', width: 20 },
      { header: 'MUNICIPIO', key: 'municipio', width: 10 },
      { header: 'REGIONAL', key: 'regional', width: 20 },
      { header: 'DATACONCLUSAO', key: 'data_conclusao', width: 10 },
      { header: 'PARCEIRA', key: 'parceira', width: 20 },
      { header: 'MOPLANEJADA', key: 'mo_planejada', width: 10 },
      { header: 'REFERENCIA', key: 'referencia', width: 10 },
      { header: 'DATAPROG', key: 'data_prog', width: 10 },
      { header: 'HORAINI', key: 'hora_ini', width: 10 },
      { header: 'HORATER', key: 'hora_ter', width: 10 },
      { header: '%PROG', key: 'prog', width: 10 },
      { header: '%EXEC', key: 'exec', width: 10 },
      { header: 'TIPOSERVICO', key: 'tipo_servico', width: 10 },
      { header: 'NUMDP', key: 'num_dp', width: 10 },
      { header: 'CHI', key: 'chi', width: 10 },
      { header: 'CHAVEPROVISORIA', key: 'chave_provisoria', width: 10 },
      { header: 'EQUIPELINHAMORTO', key: 'equipe_linha_morta', width: 10 },
      {
        header: 'EQUIPELINHAVIVA',
        key: 'equipe_linha_viva',
        width: 10,
      },
      { header: 'EQUIPEREGULARIZACAO', key: 'equipe_regularizacao', width: 15 },
      { header: 'OBSERVPROGRAMACAO', key: 'equip_desligado', width: 15 },
      { header: 'RESTRICAO_EXECUCAO', key: 'restricao_execucao', width: 10 },
      {
        header: 'NOMEDORESPONSAVELEXECUCAO',
        key: 'nome_do_responsavel_execucao',
        width: 15,
      },
      {
        header: 'RESTRICAO_PROGRAMACAO',
        key: 'restricao_programacao',
        width: 15,
      },
      {
        header: 'RESPONSABILIDADE',
        key: 'responsabilidade',
        width: 15,
      },
      {
        header: 'NOMEDORESPONSAVEL',
        key: 'nome_do_responsavel',
        width: 15,
      },
      {
        header: 'AREARESPONSAVEL',
        key: 'area_responsavel',
        width: 15,
      },
      {
        header: 'STATUSRESTRICAO',
        key: 'status_restricao',
        width: 15,
      },
      {
        header: 'DATARESOLUCAO',
        key: 'data_resolucao',
        width: 15,
      },
      {
        header: 'STATUS',
        key: 'status',
        width: 15,
      },
      {
        header: 'TIPOOBRA',
        key: 'tipo_obra',
        width: 15,
      },
      {
        header: 'GRUPO',
        key: 'grupo',
        width: 15,
      },
      {
        header: 'CIRCUITO',
        key: 'circuito',
        width: 15,
      },
      {
        header: 'CAPEXMOPLAN',
        key: 'capex_mo_plan',
        width: 15,
      },
      {
        header: 'RESTRICAO_PROGRAMACAO2',
        key: 'restricao_programacao2',
        width: 15,
      },
      {
        header: 'RESPONSABILIDADE2',
        key: 'responsabilidade2',
        width: 15,
      },
      {
        header: 'NOMEDORESPONSAVEL2',
        key: 'nome_do_responsavel2',
        width: 15,
      },
      {
        header: 'AREARESPONSAVEL2',
        key: 'area_responsavel2',
        width: 15,
      },
      {
        header: 'STATUSRESTRICAO2',
        key: 'status_restricao2',
        width: 15,
      },
      {
        header: 'DATARESOLUCAO2',
        key: 'data_resolucao2',
        width: 15,
      },
      {
        header: 'OBSERVACAORESTRICAO',
        key: 'observacao_restricao',
        width: 15,
      },
      {
        header: 'OBSERVACAOEXECUCAO',
        key: 'observacao_execucao',
        width: 15,
      },
      { header: 'STATUSPROGRAMACAO', key: 'status_programacao', width: 25 },
      {
        header: 'OBSERVACAOPROGRAMACAO',
        key: 'observacao_programacao',
        width: 25,
      },
    ];

    const batchSize = 1000;

    for (let i = 0; i < data.length; i += batchSize) {
      const batch = data.slice(i, i + batchSize);
      worksheet.addRows(batch);
    }

    await workbook.xlsx.write(res);
  }
}
