import * as Exceljs from 'exceljs';
import { Response } from 'express';

import { Inject, Injectable } from '@nestjs/common';
import {
  EXPORT_REPOSITORY,
  IExportRepository,
} from 'src/domain/contracts/IExportRepository';

@Injectable()
export class ExportRejectionsService {
  constructor(
    @Inject(EXPORT_REPOSITORY)
    private readonly exportRepository: IExportRepository,
  ) {}

  async export(response: Response) {
    const data = await this.exportRepository.exportRejections();

    const dataFormatted = data.map((item) => ({
      ovnota: item.obras.ovnota,
      ...item,
    }));

    const workbook = new Exceljs.Workbook();
    const worksheet = workbook.addWorksheet('Reprovações das Programações');

    worksheet.columns = [
      { header: 'Ov/Nota', key: 'ovnota', width: 15 },
      {
        header: 'Data Programada',
        key: 'data_prog',
        width: 15,
        style: { numFmt: 'dd/mm/yyyy' },
      },
      { header: 'Motivo da reprovação', key: 'motivo', width: 15 },
      {
        header: 'Horário Início',
        key: 'hora_ini',
        width: 15,
        style: { numFmt: 'hh:mm' },
      },
      {
        header: 'Horário Término',
        key: 'hora_ter',
        width: 15,
        style: { numFmt: 'hh:mm' },
      },
      { header: '% Programado', key: 'prog', width: 10 },
      { header: 'Descrição', key: 'descricao', width: 20 },
      { header: 'Equipamento desligado', key: 'equip_desligado', width: 20 },
      { header: 'Equipes Linha Morta', key: 'equipe_linha_morta', width: 10 },
      { header: 'Equipes Linha Viva', key: 'equipe_linha_viva', width: 10 },
      {
        header: 'Equipes Regularização',
        key: 'equipe_regularizacao',
        width: 10,
      },
      { header: 'Tipo serviço', key: 'tipo_servico', width: 10 },
      {
        header: 'Observação da Programação',
        key: 'observacao_programacao',
        width: 30,
      },
    ];

    const batchSize = 1000;

    for (let i = 0; i < dataFormatted.length; i += batchSize) {
      const batch = dataFormatted.slice(i, i + batchSize);
      worksheet.addRows(batch);
    }

    await workbook.xlsx.write(response);
  }
}
