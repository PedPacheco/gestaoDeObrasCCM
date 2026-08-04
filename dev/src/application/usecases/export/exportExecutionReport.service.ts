import * as ExcelJS from 'exceljs';
import { Response } from 'express';

import { Inject, Injectable } from '@nestjs/common';
import {
  EXPORT_REPOSITORY,
  IExportRepository,
} from 'src/domain/contracts/IExportRepository';

@Injectable()
export class ExportExecutionReportService {
  constructor(
    @Inject(EXPORT_REPOSITORY)
    private readonly exportRepository: IExportRepository,
  ) {}

  async export(response: Response) {
    const data = await this.exportRepository.exportExecutionReport();

    const formattedData = data.map((item) => ({
      ...item,
      id: item.id,

      // usuario
      nome_usuario: item.usuario?.nome_usuario ?? null,

      // obras
      ovnota: item.obras?.ovnota ?? null,
      diagrama: item.obras?.diagrama ?? null,
      ordem_dci: item.obras?.ordem_dci ?? null,
      ordem_dca: item.obras?.ordem_dca ?? null,
      ordem_dcd: item.obras?.ordem_dcd ?? null,
      ordem_dcim: item.obras?.ordem_dcim ?? null,
      tipo_obra: item.obras?.tipos?.tipo_obra ?? null,
      status_obra: item.obras?.status?.status ?? null,
      executado: item.obras?.executado ?? null,
      parceira: item.obras?.turmas?.turma ?? null,

      // programações
      data_prog: item.programacoes?.data_prog ?? null,
      prog: item.programacoes?.prog ?? null,
      exec: item.programacoes?.exec ?? null,
      num_dp: item.programacoes?.num_dp ?? null,
      hora_ini: item.programacoes?.hora_ini ?? null,
      hora_ter: item.programacoes?.hora_ter ?? null,
      chave_provisoria: item.programacoes?.chave_provisoria ?? null,

      // remove objetos aninhados do resultado final
      usuario: undefined,
      obras: undefined,
      programacoes: undefined,
    }));

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Relatórios de execução');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      // Usuário e obra
      { header: 'Supervisor', key: 'supervisor', width: 25 },
      { header: 'Usuário', key: 'nome_usuario', width: 25 },

      { header: 'Ovnota', key: 'ovnota', width: 15 },
      { header: 'Diagrama', key: 'diagrama', width: 15 },
      { header: 'Ordem DCI', key: 'ordem_dci', width: 15 },
      { header: 'Ordem DCA', key: 'ordem_dca', width: 15 },
      { header: 'Ordem DCD', key: 'ordem_dcd', width: 15 },
      { header: 'Ordem DCIM', key: 'ordem_dcim', width: 15 },
      { header: 'Tipo da Obra', key: 'tipo_obra', width: 20 },
      { header: 'Status da Obra', key: 'status_obra', width: 20 },
      { header: 'Total Executado', key: 'executado', width: 15 },
      { header: 'Parceira', key: 'parceira', width: 20 },

      // Programação
      {
        header: 'Data de criação',
        key: 'criado_em',
        width: 20,
        style: { numFmt: 'dd/mm/yyyy hh:mm' },
      },
      {
        header: 'Data Programada',
        key: 'data_prog',
        width: 20,
        style: { numFmt: 'dd/mm/yyyy' },
      },
      { header: 'Programado', key: 'prog', width: 10 },
      { header: 'Executado', key: 'exec', width: 10 },
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
      { header: 'Chave Provisória', key: 'chave_provisoria', width: 18 },

      // Relatório Execução
      {
        header: 'Liberado Ligação Publicação',
        key: 'liberado_ligacao_parcial',
        width: 25,
      },

      {
        header: 'Hora Início Execução',
        key: 'hora_inicio',
        width: 20,
        style: { numFmt: 'hh:mm' },
      },
      {
        header: 'Hora Conclusão Execução',
        key: 'hora_conclusao',
        width: 20,
        style: { numFmt: 'hh:mm' },
      },
      { header: 'Contato Início', key: 'contato_inicio', width: 20 },
      { header: 'Contato Término', key: 'contato_termino', width: 20 },

      { header: 'Atraso', key: 'atraso', width: 10 },
      {
        header: 'Justificativa Atraso',
        key: 'justificativa_atraso',
        width: 50,
      },

      {
        header: 'Possui Equip. Instalados',
        key: 'possui_equipamentos_instalados',
        width: 15,
      },
      {
        header: 'Equip. Aplicados',
        key: 'equipamentos_aplicados',
        width: 40,
      },
      {
        header: 'Potência Equip. Aplicado',
        key: 'potencia_equipamento_aplicado',
        width: 20,
      },
      {
        header: 'Patrimônio Equip. Aplicado',
        key: 'patrimonio_equipamento_aplicado',
        width: 20,
      },
      {
        header: 'Instalação Equip. Aplicado',
        key: 'instalacao_equipamento_aplicado',
        width: 20,
      },
      {
        header: 'Possui Equip. Retirados',
        key: 'possui_equipamentos_retirados',
        width: 15,
      },
      {
        header: 'Equip. Retirados',
        key: 'equipamentos_retirados',
        width: 40,
      },
      {
        header: 'Potência Equip. Retirado',
        key: 'potencia_equipamento_retirado',
        width: 20,
      },
      {
        header: 'Patrimônio Equip. Retirado',
        key: 'patrimonio_equipamento_retirado',
        width: 20,
      },
      {
        header: 'Instalação Equip. Retirado',
        key: 'instalacao_equipamento_retirado',
        width: 20,
      },
      { header: 'Observações Gerais', key: 'observacoes_gerais', width: 50 },
      {
        header: 'Chave Provisória Instalada',
        key: 'chave_provisoria_instalada',
        width: 25,
      },
      {
        header: 'Ref. Chave Prov. Instalada',
        key: 'referencia_chave_provisoria',
        width: 30,
      },
      {
        header: 'Chave Provisória Retirada',
        key: 'chave_provisoria_retirada',
        width: 25,
      },
      {
        header: 'Ref. Chave Prov. Retirada',
        key: 'referencia_chave_provisoria_retirada',
        width: 30,
      },

      { header: 'Motivo', key: 'motivo', width: 40 },
    ];

    const batchSize = 1000;

    for (let i = 0; i < formattedData.length; i += batchSize) {
      const batch = formattedData.slice(i, i + batchSize);
      worksheet.addRows(batch);
    }

    await workbook.xlsx.write(response);
  }
}
