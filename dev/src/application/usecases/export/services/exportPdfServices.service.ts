import { Response } from 'express';
import moment from 'moment';
import PDFDocument from 'pdfkit';

import { Injectable } from '@nestjs/common';

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

type PdfDocumentType = InstanceType<typeof PDFDocument>;

export type ExportServiceItem = {
  codigo: string | null;
  descricao: string | null;
  operacao: string;
  ponto: string;
  prog: number | null;
  real: number | null;
  equipe: string | null;
};

export type ExportServicesPdfOutput = {
  ovnota: string;
  ordemDiagrama: string | null;
  referencia: string | null;
  tipo_obra: string;
  municipio: string;
  circuito: string;
  conjunto: string;
  parceira: string;
  empreendimento: string | null;
  programacao: {
    data_prog: Date;
    prog: number;
    tipo_servico: string | null;
    observacao_programacao: string | null;
    chi: number | null;
    num_dp: string | null;
    chave_provisoria: boolean | null;
  } | null;
  servicos: ExportServiceItem[];
};

const PAGE_MARGIN = 40;
const HEADER_HEIGHT = 60;
const HEADER_BG_COLOR = '#212E3E';
const CONTENT_START_Y = HEADER_HEIGHT + 12;

const CARD_BORDER_COLOR = '#D8DEE6';
const SECTION_TITLE_BG = '#EEF1F5';
const LABEL_COLOR = '#6B7684';
const VALUE_COLOR = '#1B1F24';

const CARD_GAP = 12; // espaço horizontal entre cards
const CARD_HEIGHT = 28; // altura de cada card (era 42)
const CARD_ROW_GAP = 6; // espaço vertical entre linhas de cards (era 50/100 -> CARD_HEIGHT+gap)

const SECTION_TITLE_HEIGHT = 18; // era 22
const SECTION_TITLE_GAP = 8; // espaço entre título e primeira linha de cards (era 35)
const SECTION_BOTTOM_GAP = 10; // espaço após a última linha de cards da seção (era 110/160)

const TABLE_ROW_HEIGHT = 16; // era 18
const TABLE_HEADER_HEIGHT = 18; // era 20/25

const EDP_LOGO_PATH = join(process.cwd(), 'src/assets', 'edpLogo.png');
const SIGO_LOGO_PATH = join(process.cwd(), 'src/assets', 'novo-logo-sigo.png');

@Injectable()
export class ExportPdfServicesService {
  private edpLogoBuffer: Buffer | null = null;
  private sigoLogoBuffer: Buffer | null = null;

  async export(
    servicesData: ExportServicesPdfOutput[],
    response: Response,
  ): Promise<void> {
    this.edpLogoBuffer = this.safeReadLogo(EDP_LOGO_PATH);
    this.sigoLogoBuffer = this.safeReadLogo(SIGO_LOGO_PATH);

    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margin: PAGE_MARGIN,
      bufferPages: true,
      autoFirstPage: true,
    });

    doc.pipe(response);

    for (let i = 0; i < servicesData.length; i++) {
      const obra = servicesData[i];

      if (i > 0) {
        doc.addPage();
      }

      this.drawHeader(doc, obra);

      let y = this.drawWorkInformation(doc, obra, CONTENT_START_Y);
      y = this.drawProgrammingInformation(doc, obra, y);
      this.drawServicesTable(doc, obra, y);
    }

    doc.flushPages();

    doc.end();
  }

  private safeReadLogo(path: string): Buffer | null {
    try {
      return existsSync(path) ? readFileSync(path) : null;
    } catch {
      return null;
    }
  }

  private getContentWidth(doc: PdfDocumentType) {
    return doc.page.width - PAGE_MARGIN * 2;
  }

  private drawHeader(doc: PdfDocumentType, data: ExportServicesPdfOutput) {
    const equipe = data.servicos[0]?.equipe ?? '-';

    doc.rect(0, 0, doc.page.width, HEADER_HEIGHT).fill(HEADER_BG_COLOR);

    if (this.sigoLogoBuffer) {
      doc.image(this.sigoLogoBuffer, PAGE_MARGIN, 16, { width: 180 });
    }

    if (this.edpLogoBuffer) {
      doc.image(this.edpLogoBuffer, doc.page.width - 120, 16, { width: 80 });
    }

    const fields = [
      { label: 'OV/NOTA', value: data.ovnota },
      {
        label: 'DATA PROGRAMADA',
        value: data.programacao?.data_prog
          ? moment.utc(data.programacao.data_prog).format('DD/MM/YYYY')
          : '-',
      },
      { label: 'EQUIPE', value: equipe },
    ];

    const startX = 300;
    const startY = 16;
    const fieldWidth = 120;

    fields.forEach((field, index) => {
      const x = startX + index * fieldWidth;

      doc
        .fillColor('#B8C0CC')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(field.label, x, startY, {
          width: fieldWidth,
          align: 'center',
          lineBreak: false,
        });

      doc
        .fillColor('white')
        .font('Helvetica-Bold')
        .fontSize(10)
        .text(field.value, x, startY + 12, {
          width: fieldWidth,
          align: 'center',
        });
    });

    doc
      .moveTo(PAGE_MARGIN, HEADER_HEIGHT - 8)
      .lineTo(doc.page.width - PAGE_MARGIN, HEADER_HEIGHT - 8)
      .lineWidth(1)
      .stroke('#465365');

    doc.fillColor('#000000').font('Helvetica');

    doc.x = PAGE_MARGIN;
    doc.y = CONTENT_START_Y;
  }

  /** Desenha o título de uma seção e retorna o Y onde a primeira linha de cards deve começar. */
  private drawSectionTitle(
    doc: PdfDocumentType,
    y: number,
    title: string,
  ): number {
    const contentWidth = this.getContentWidth(doc);

    doc
      .rect(PAGE_MARGIN, y, contentWidth, SECTION_TITLE_HEIGHT)
      .fill(SECTION_TITLE_BG);

    doc
      .fillColor(VALUE_COLOR)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(title, PAGE_MARGIN + 10, y + 4);

    return y + SECTION_TITLE_HEIGHT + SECTION_TITLE_GAP;
  }

  private drawWorkInformation(
    doc: PdfDocumentType,
    data: ExportServicesPdfOutput,
    startY: number,
  ): number {
    const contentWidth = this.getContentWidth(doc);
    const row1Y = this.drawSectionTitle(doc, startY, 'INFORMAÇÕES DA OBRA');

    const cardWidth = (contentWidth - 3 * CARD_GAP) / 4;
    const col = (index: number) => PAGE_MARGIN + index * (cardWidth + CARD_GAP);
    const row2Y = row1Y + CARD_HEIGHT + CARD_ROW_GAP;

    this.drawFieldCard(doc, col(0), row1Y, cardWidth, 'TIPO', data.tipo_obra);
    this.drawFieldCard(
      doc,
      col(1),
      row1Y,
      cardWidth,
      'MUNICÍPIO',
      data.municipio,
    );
    this.drawFieldCard(
      doc,
      col(2),
      row1Y,
      cardWidth,
      'REFERÊNCIA',
      data.referencia ?? '-',
    );
    this.drawFieldCard(
      doc,
      col(3),
      row1Y,
      cardWidth,
      'ORDEM/DIAGRAMA',
      data.ordemDiagrama ?? '-',
    );

    this.drawFieldCard(
      doc,
      col(0),
      row2Y,
      cardWidth,
      'CIRCUITO',
      data.circuito,
    );
    this.drawFieldCard(
      doc,
      col(1),
      row2Y,
      cardWidth,
      'CONJUNTO',
      data.conjunto,
    );
    this.drawFieldCard(
      doc,
      col(2),
      row2Y,
      cardWidth,
      'PARCEIRA',
      data.parceira,
    );
    this.drawFieldCard(
      doc,
      col(3),
      row2Y,
      cardWidth,
      'EMPREENDIMENTO',
      data.empreendimento ?? '-',
    );

    return row2Y + CARD_HEIGHT + SECTION_BOTTOM_GAP;
  }

  private drawProgrammingInformation(
    doc: PdfDocumentType,
    data: ExportServicesPdfOutput,
    startY: number,
  ): number {
    const programacao = data.programacao;
    const contentWidth = this.getContentWidth(doc);

    const row1Y = this.drawSectionTitle(doc, startY, 'DADOS DA PROGRAMAÇÃO');

    const cardWidth = (contentWidth - 4 * CARD_GAP) / 5;
    const col = (index: number) => PAGE_MARGIN + index * (cardWidth + CARD_GAP);
    const row2Y = row1Y + CARD_HEIGHT + CARD_ROW_GAP;

    this.drawFieldCard(
      doc,
      col(0),
      row1Y,
      cardWidth,
      'TIPO SERVIÇO',
      programacao?.tipo_servico ?? '-',
    );
    this.drawFieldCard(
      doc,
      col(1),
      row1Y,
      cardWidth,
      'PROGRAMADO',
      `${programacao?.prog ?? 0}%`,
    );
    this.drawFieldCard(
      doc,
      col(2),
      row1Y,
      cardWidth,
      'CHI',
      String(programacao?.chi ?? '-'),
    );
    this.drawFieldCard(
      doc,
      col(3),
      row1Y,
      cardWidth,
      'Nº DP',
      programacao?.num_dp ?? '-',
    );
    this.drawFieldCard(
      doc,
      col(4),
      row1Y,
      cardWidth,
      'CHAVE PROVISÓRIA',
      programacao?.chave_provisoria ? 'Sim' : 'Não',
    );

    this.drawFieldCard(
      doc,
      PAGE_MARGIN,
      row2Y,
      contentWidth,
      'OBSERVAÇÃO',
      programacao?.observacao_programacao ?? '-',
    );

    return row2Y + CARD_HEIGHT + SECTION_BOTTOM_GAP;
  }

  private sanitizeCell(value: string | null | undefined): string {
    if (!value) return '-';
    return value.replace(/\s*[\r\n]+\s*/g, ' ').trim() || '-';
  }

  private drawServicesTable(
    doc: PdfDocumentType,
    data: ExportServicesPdfOutput,
    startY: number,
  ) {
    const FOOTER_SPACE = 30;
    const columns = this.getTableColumns(doc);

    doc
      .fillColor(VALUE_COLOR)
      .font('Helvetica-Bold')
      .fontSize(10)
      .text('SERVIÇOS E MATERIAIS', PAGE_MARGIN, startY);

    let currentY = startY + 16;

    const renderTableHeader = () => {
      this.drawTableHeader(doc, currentY, columns, data);
      currentY += TABLE_HEADER_HEIGHT;
    };

    renderTableHeader();

    const cellOptions = { lineBreak: false, ellipsis: true } as const;

    for (const item of data.servicos) {
      const maxY = doc.page.height - FOOTER_SPACE;

      if (currentY + TABLE_ROW_HEIGHT > maxY) {
        doc.addPage();
        currentY = PAGE_MARGIN + 30;

        doc
          .font('Helvetica-Bold')
          .fontSize(10)
          .text('SERVIÇOS E MATERIAIS (CONTINUAÇÃO)', PAGE_MARGIN, currentY);

        currentY += 16;
        renderTableHeader();
      }

      doc.font('Helvetica').fontSize(8);
      const textY = currentY + 4;

      doc.text(this.sanitizeCell(item.codigo), columns.codigo.x, textY, {
        width: columns.codigo.width,
        ...cellOptions,
      });
      doc.text(this.sanitizeCell(item.descricao), columns.descricao.x, textY, {
        width: columns.descricao.width,
        ...cellOptions,
      });
      doc.text(this.sanitizeCell(item.operacao), columns.operacao.x, textY, {
        width: columns.operacao.width,
        ...cellOptions,
      });
      doc.text(this.sanitizeCell(item.ponto), columns.ponto.x, textY, {
        width: columns.ponto.width,
        ...cellOptions,
      });
      doc.text(
        item.prog !== null ? String(item.prog) : '-',
        columns.prog.x,
        textY,
        { width: columns.prog.width, ...cellOptions },
      );

      doc
        .strokeColor('#D9D9D9')
        .lineWidth(0.5)
        .moveTo(PAGE_MARGIN, currentY + TABLE_ROW_HEIGHT - 2)
        .lineTo(doc.page.width - PAGE_MARGIN, currentY + TABLE_ROW_HEIGHT - 2)
        .stroke();

      currentY += TABLE_ROW_HEIGHT;
    }

    this.drawServicesTotal(doc, data, currentY, FOOTER_SPACE);
  }

  private drawServicesTotal(
    doc: PdfDocumentType,
    data: ExportServicesPdfOutput,
    currentY: number,
    footerSpace: number,
  ) {
    const totalLineHeight = 16;
    let y = currentY + 8;

    // Só cria página nova se realmente não couber, e sem redesenhar o header pesado
    if (y + totalLineHeight > doc.page.height - footerSpace) {
      doc.addPage();
      y = PAGE_MARGIN;
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(`Total de itens: ${data.servicos.length}`, PAGE_MARGIN, y);
  }

  private getTableColumns(doc: PdfDocumentType) {
    const contentWidth = this.getContentWidth(doc);

    const codigoWidth = 55;
    const operacaoWidth = 95;
    const pontoWidth = 50;
    const progWidth = 50;
    const realWidth = 50;

    const descricaoWidth =
      contentWidth -
      codigoWidth -
      operacaoWidth -
      pontoWidth -
      progWidth -
      realWidth -
      5 * 10;

    let x = PAGE_MARGIN + 5;

    const codigo = { x, width: codigoWidth };
    x += codigoWidth + 10;

    const descricao = { x, width: descricaoWidth };
    x += descricaoWidth + 10;

    const operacao = { x, width: operacaoWidth };
    x += operacaoWidth + 10;

    const ponto = { x, width: pontoWidth };
    x += pontoWidth + 10;

    const prog = { x, width: progWidth };
    x += progWidth + 10;

    const real = { x, width: realWidth };

    return { codigo, descricao, operacao, ponto, prog, real };
  }

  private drawTableHeader(
    doc: PdfDocumentType,
    y: number,
    columns: ReturnType<ExportPdfServicesService['getTableColumns']>,
    obra: ExportServicesPdfOutput,
  ) {
    const contentWidth = this.getContentWidth(doc);

    doc.rect(PAGE_MARGIN, y, contentWidth, TABLE_HEADER_HEIGHT).fill('#D9EAF7');

    this.drawHeader(doc, obra);

    doc.fillColor('black');
    doc.font('Helvetica-Bold').fontSize(8);

    doc.text('Código', columns.codigo.x, y + 4);
    doc.text('Descrição', columns.descricao.x, y + 4);
    doc.text('Operação', columns.operacao.x, y + 4);
    doc.text('Ponto', columns.ponto.x, y + 4);
    doc.text('Prog', columns.prog.x, y + 4);
    doc.text('Real', columns.real.x, y + 4);
  }

  private drawFieldCard(
    doc: PdfDocumentType,
    x: number,
    y: number,
    width: number,
    label: string,
    value: string,
  ) {
    doc.rect(x, y, width, CARD_HEIGHT).stroke(CARD_BORDER_COLOR);

    doc
      .fillColor(LABEL_COLOR)
      .font('Helvetica-Bold')
      .fontSize(6.5)
      .text(label, x + 6, y + 4);

    doc
      .fillColor(VALUE_COLOR)
      .font('Helvetica')
      .fontSize(9)
      .text(value || '-', x + 6, y + 14, {
        width: width - 12,
        lineBreak: false,
        ellipsis: true,
      });
  }
}
