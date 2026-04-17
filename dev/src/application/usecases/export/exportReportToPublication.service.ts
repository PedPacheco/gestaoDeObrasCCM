import * as ExcelJS from 'exceljs';
import { Response } from 'express';
import moment from 'moment';

import { Inject, Injectable } from '@nestjs/common';
import {
  EXPORT_REPOSITORY,
  IExportRepository,
} from 'src/domain/repositories/IExportRepository';
import { buildEquipamentosFormatados } from 'src/utils/buildFormattedEquipments';

@Injectable()
export class ExportReportToPubliationService {
  constructor(
    @Inject(EXPORT_REPOSITORY)
    private readonly exportRepository: IExportRepository,
  ) {}

  async export(response: Response) {
    try {
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
        prazo_obra: moment(item.obras.entrada)
          .add(item.obras.prazo, 'days')
          .format('DD/MM/YYYY'),

        data_prog: item.programacoes?.data_prog,

        // 🔥 AQUI entra o helper (APLICADOS)
        equipamentos_aplicados: buildEquipamentosFormatados(
          item.instalacao_equipamento_aplicado,
          item.equipamentos_aplicados,
          item.potencia_equipamento_aplicado,
          item.patrimonio_equipamento_aplicado,
        ),

        // 🔥 OPCIONAL: FAZER O MESMO PARA RETIRADOS
        equipamentos_retirados: buildEquipamentosFormatados(
          item.instalacao_equipamento_retirado,
          item.equipamentos_retirados,
          item.potencia_equipamento_retirado,
          item.patrimonio_equipamento_retirado,
        ),

        criado_em: moment(item.criado_em)
          .utcOffset(-3)
          .format('DD/MM/YYYY HH:mm'),

        // remove objetos aninhados
        usuario: undefined,
        obras: undefined,
        programacoes: undefined,
      }));

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Relatórios de execução');

      worksheet.columns = [
        { header: 'Observações Gerais', key: 'observacoes_gerais', width: 50 },
        { header: 'ID', key: 'id', width: 10 },
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
        {
          header: 'Liberado para Publicação',
          key: 'liberado_ligacao_parcial',
          width: 25,
        },
        {
          header: 'Possui Equip. Instalados',
          key: 'possui_equipamentos_instalados',
          width: 15,
        },
        {
          header: 'Equip. Aplicados',
          key: 'equipamentos_aplicados',
          width: 60,
          style: {
            alignment: {
              wrapText: true,
              vertical: 'top',
            },
          },
        },
        {
          header: 'Possui Equip. Retirados',
          key: 'possui_equipamentos_retirados',
          width: 15,
        },

        {
          header: 'Equip. Retirados',
          key: 'equipamentos_retirados',
          width: 60,
          style: {
            alignment: {
              wrapText: true,
              vertical: 'top',
            },
          },
        },
        {
          header: 'Vencimento da OV',
          key: 'prazo_obra',
          width: 20,
          style: { numFmt: 'dd/mm/yyyy' },
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
