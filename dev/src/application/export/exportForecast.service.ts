import * as ExcelJS from 'exceljs';
import { Response } from 'express';

import { Inject, Injectable } from '@nestjs/common';
import {
  EXPORT_REPOSITORY,
  IExportRepository,
} from 'src/domain/repositories/IExportRepository';
import { DeadlineStatusService } from 'src/domain/services/deadlineStatus.service';

@Injectable()
export class ExportForecastService {
  constructor(
    @Inject(EXPORT_REPOSITORY)
    private readonly exportRepository: IExportRepository,
    private readonly deadlineStatusService: DeadlineStatusService,
  ) {}

  async export(response: Response) {
    const data = await this.exportRepository.exportForecast();

    const worksWithDeadlineStatus = data.map((work) => {
      return {
        ...work,
        status_prazo: this.deadlineStatusService.calculate(work),
      };
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Forecast');

    worksheet.columns = [
      { header: 'Nota/Ov', key: 'ovnota', width: 10 },
      { header: 'Diagrama', key: 'diagrama', width: 20 },
      { header: 'Ordem DCI', key: 'ordem_dci', width: 20 },
      { header: 'Ordem DCD', key: 'ordem_dcd', width: 20 },
      { header: 'Ordem DCA', key: 'ordem_dca', width: 20 },
      { header: 'Ordem DCIM', key: 'ordem_dcim', width: 20 },
      { header: 'Municipio', key: 'municipio', width: 20 },
      { header: 'Regional', key: 'regional', width: 20 },
      { header: 'Conjunto', key: 'conjunto', width: 15 },
      { header: 'Circuito', key: 'circuito', width: 10 },
      { header: 'Prazo', key: 'prazo_fim', width: 15 },
      { header: 'Status Prazo', key: 'status_prazo', width: 15 },
      { header: 'Status SAP', key: 'status_ov_sap', width: 10 },
      { header: 'Tipo', key: 'tipo_obra', width: 25 },
      { header: 'Grupo', key: 'grupo', width: 20 },
      { header: 'Quantidade planejada', key: 'qtde_planejada', width: 15 },
      { header: 'Quantidade pendente', key: 'qtde_pend', width: 15 },
      { header: 'Quantidade programada', key: 'qtde_prog', width: 15 },
      { header: 'MO planejada', key: 'mo_planejada', width: 15 },
      { header: 'MO Programado', key: 'mo_prog', width: 15 },
      { header: 'Material planejada', key: 'capex_mat_plan', width: 15 },
      { header: 'Material pendente', key: 'capex_mat_pend', width: 15 },
      { header: 'Material programado', key: 'mat_prog', width: 15 },
      { header: 'Serviço planejado', key: 'capex_mo_plan', width: 15 },
      { header: 'Serviço pendente', key: 'capex_mo_pend', width: 15 },
      { header: 'Serviço programado', key: 'servico_prog', width: 15 },
      { header: 'Parceira', key: 'parceira', width: 20 },
      { header: 'Executado', key: 'executado', width: 10 },
      { header: 'Status da Obra', key: 'status', width: 20 },
      { header: 'Status da Programação', key: 'status_programacao', width: 20 },
      {
        header: 'Data de criação',
        key: 'criado_em',
        width: 15,
        style: { numFmt: 'dd/mm/yyyy' },
      },
      { header: 'Criado por', key: 'usuario_criador', width: 15 },
      { header: 'Editado por', key: 'usuario_ultima_atualizacao', width: 15 },
      { header: 'Reprovar', key: 'reprovada', width: 10 },
      { header: 'Validar', key: 'validada', width: 10 },
      { header: 'Confirmar', key: 'confirmada', width: 10 },
      {
        header: 'Data Programada',
        key: 'data_prog',
        width: 10,
        style: { numFmt: 'dd/mm/yyyy' },
      },
      { header: '% Programado', key: 'prog', width: 10 },
      { header: '% Executado', key: 'exec', width: 10 },
      { header: 'CHI', key: 'chi', width: 10 },
      { header: 'Chave provisória', key: 'chave_provisoria', width: 10 },
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
        header: 'Equipe Reg',
        key: 'equipe_regularizacao',
        width: 10,
      },
      { header: 'Técnico Responsável', key: 'tecnico', width: 20 },
      { header: 'Motivo da Restrição', key: 'restricao_execucao', width: 15 },
      {
        header: 'Responsabilidae',
        key: 'nome_responsavel_execucao',
        width: 20,
      },
    ];

    const batchSize = 1000;

    for (let i = 0; i < worksWithDeadlineStatus.length; i += batchSize) {
      const batch = worksWithDeadlineStatus.slice(i, i + batchSize);
      worksheet.addRows(batch);
    }

    await workbook.xlsx.write(response);
  }
}
