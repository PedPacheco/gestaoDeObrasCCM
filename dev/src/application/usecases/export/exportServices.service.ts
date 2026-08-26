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

export type ExportServicesOutput = {
  ovnota: string;
  ordemDiagrama: string | null;
  referencia: string | null;
  tipo_obra: string;
  municipio: string;
  circuito: string;
  conjunto: string;
  parceira: string;
  empreendimento: string | null;
  observ_obra: string | null;
  programacao: {
    data_prog: Date;
    prog: number;
    exec: number | null;
    hora_ini: Date | null;
    hora_ter: Date | null;
    tipo_servico: string | null;
    observacao_programacao: string | null;
    equip_desligado: string | null;
    chi: number | null;
    num_dp: string | null;
    chave_provisoria: boolean | null;
    equipe_linha_morta: number | null;
    equipe_linha_viva: number | null;
    equipe_regularizacao: number | null;
  } | null;
  servicos: ExportServiceItem[];
};

const PAGE_MARGIN = 40;
const HEADER_HEIGHT = 70;
const HEADER_BG_COLOR = '#212E3E';
const CONTENT_START_Y = HEADER_HEIGHT + 20;

const CARD_BORDER_COLOR = '#D8DEE6';
const SECTION_TITLE_BG = '#EEF1F5';
const LABEL_COLOR = '#6B7684';
const VALUE_COLOR = '#1B1F24';

const EDP_LOGO_PATH = join(process.cwd(), 'src/assets', 'edpLogo.png');

const SIGO_LOGO_PATH = join(process.cwd(), 'src/assets', 'novo-logo-sigo.png');

@Injectable()
export class ExportServicesService {
  private edpLogoBuffer: Buffer | null = null;
  private sigoLogoBuffer: Buffer | null = null;

  async export(
    servicesData: ExportServicesOutput[],
    response: Response,
  ): Promise<void> {
    this.edpLogoBuffer = this.safeReadLogo(EDP_LOGO_PATH);
    this.sigoLogoBuffer = this.safeReadLogo(SIGO_LOGO_PATH);

    const doc = new PDFDocument({
      size: 'A4',
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

      this.drawWorkInformation(doc, obra);
      this.drawProgrammingInformation(doc, obra);
      this.drawServicesTable(doc, obra);
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

  private drawHeader(doc: PdfDocumentType, data: ExportServicesOutput) {
    const equipe = data.servicos[0]?.equipe ?? '-';

    doc.rect(0, 0, doc.page.width, HEADER_HEIGHT).fill(HEADER_BG_COLOR);

    // Logo EDP
    if (this.edpLogoBuffer) {
      doc.image(this.edpLogoBuffer, PAGE_MARGIN, 15, {
        width: 75,
      });
    }

    if (this.sigoLogoBuffer) {
      doc.image(this.sigoLogoBuffer, doc.page.width - 160, 20, {
        width: 140,
      });
    }

    const fields = [
      {
        label: 'OV/NOTA',
        value: data.ovnota,
      },
      {
        label: 'DATA PROGRAMADA',
        value: data.programacao?.data_prog
          ? moment(data.programacao.data_prog).format('DD/MM/YYYY')
          : '-',
      },
      {
        label: 'EQUIPE',
        value: equipe,
      },
    ];

    const startX = 140;
    const startY = 22;
    const fieldWidth = 100;

    fields.forEach((field, index) => {
      const x = startX + index * fieldWidth;

      doc
        .fillColor('#B8C0CC')
        .font('Helvetica-Bold')
        .fontSize(7)
        .text(field.label, x, startY, {
          width: fieldWidth,
          align: 'center',
        });

      doc
        .fillColor('white')
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(field.value, x, startY + 14, {
          width: fieldWidth,
          align: 'center',
        });
    });

    // Linha separadora
    doc
      .moveTo(PAGE_MARGIN, HEADER_HEIGHT - 10)
      .lineTo(doc.page.width - PAGE_MARGIN, HEADER_HEIGHT - 10)
      .lineWidth(1)
      .stroke('#465365');

    doc.fillColor('#000000').font('Helvetica');

    doc.x = PAGE_MARGIN;
    doc.y = CONTENT_START_Y;
  }

  private drawWorkInformation(
    doc: PdfDocumentType,
    data: ExportServicesOutput,
  ) {
    doc.y = CONTENT_START_Y;

    const titleY = doc.y;

    doc.rect(PAGE_MARGIN, titleY, 515, 22).fill(SECTION_TITLE_BG);

    doc
      .fillColor(VALUE_COLOR)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('INFORMAÇÕES DA OBRA', PAGE_MARGIN + 10, titleY + 5);

    const y = titleY + 35;

    const cardWidth = 165;

    this.drawFieldCard(doc, 40, y, cardWidth, 'TIPO', data.tipo_obra);

    this.drawFieldCard(doc, 215, y, cardWidth, 'MUNICÍPIO', data.municipio);

    this.drawFieldCard(
      doc,
      390,
      y,
      cardWidth,
      'REFERÊNCIA',
      data.referencia ?? '-',
    );

    this.drawFieldCard(
      doc,
      40,
      y + 50,
      cardWidth,
      'ORDEM/DIAGRAMA',
      data.ordemDiagrama ?? '-',
    );

    this.drawFieldCard(doc, 215, y + 50, cardWidth, 'CIRCUITO', data.circuito);

    this.drawFieldCard(doc, 390, y + 50, cardWidth, 'CONJUNTO', data.conjunto);

    this.drawFieldCard(doc, 40, y + 100, cardWidth, 'PARCEIRA', data.parceira);

    this.drawFieldCard(
      doc,
      215,
      y + 100,
      340,
      'EMPREENDIMENTO',
      data.empreendimento ?? '-',
    );

    doc.y = y + 160;
  }

  private drawProgrammingInformation(
    doc: PdfDocumentType,
    data: ExportServicesOutput,
  ) {
    const programacao = data.programacao;

    const titleY = doc.y;

    doc.rect(PAGE_MARGIN, titleY, 515, 22).fill(SECTION_TITLE_BG);

    doc
      .fillColor(VALUE_COLOR)
      .font('Helvetica-Bold')
      .fontSize(11)
      .text('DADOS DA PROGRAMAÇÃO', PAGE_MARGIN + 10, titleY + 5);

    const y = titleY + 35;

    const cardWidth = 165;

    this.drawFieldCard(
      doc,
      40,
      y,
      cardWidth,
      'TIPO SERVIÇO',
      programacao?.tipo_servico ?? '-',
    );

    this.drawFieldCard(
      doc,
      215,
      y,
      cardWidth,
      'PROGRESSO',
      `${programacao?.prog ?? 0}%`,
    );

    this.drawFieldCard(
      doc,
      390,
      y,
      cardWidth,
      'EXECUÇÃO',
      `${programacao?.exec ?? 0}%`,
    );

    this.drawFieldCard(
      doc,
      40,
      y + 50,
      cardWidth,
      'CHI',
      String(programacao?.chi ?? '-'),
    );

    this.drawFieldCard(
      doc,
      215,
      y + 50,
      cardWidth,
      'Nº DP',
      programacao?.num_dp ?? '-',
    );

    this.drawFieldCard(
      doc,
      390,
      y + 50,
      cardWidth,
      'CHAVE PROVISÓRIA',
      programacao?.chave_provisoria ? 'Sim' : 'Não',
    );

    this.drawFieldCard(
      doc,
      40,
      y + 100,
      515,
      'OBSERVAÇÃO',
      programacao?.observacao_programacao ?? '-',
    );

    doc.y = y + 110;
  }

  private drawServicesTable(doc: PdfDocumentType, data: ExportServicesOutput) {
    const ROW_HEIGHT = 18;
    const FOOTER_SPACE = 40;

    doc.y += 40;

    doc
      .fillColor(VALUE_COLOR)
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('SERVIÇOS E MATERIAIS', PAGE_MARGIN + 10, doc.y + 5);

    doc.moveDown();

    let currentY = doc.y + 5;

    const renderTableHeader = () => {
      this.drawTableHeader(doc, currentY);
      currentY += 25;
    };

    renderTableHeader();

    for (const item of data.servicos) {
      const maxY = doc.page.height - FOOTER_SPACE;

      if (currentY + ROW_HEIGHT > maxY) {
        doc.addPage();

        currentY = 60;

        doc
          .font('Helvetica-Bold')
          .fontSize(12)
          .text('SERVIÇOS E MATERIAIS (CONTINUAÇÃO)', PAGE_MARGIN, currentY);

        currentY += 25;

        renderTableHeader();
      }

      doc.font('Helvetica').fontSize(9);

      doc.text(item.codigo ?? '-', 45, currentY, {
        width: 60,
        lineBreak: false,
      });

      doc.text(item.descricao ?? '-', 110, currentY, {
        width: 220,
        lineBreak: false,
      });

      doc.text(item.operacao ?? '-', 340, currentY, {
        width: 80,
        lineBreak: false,
      });

      doc.text(item.ponto ?? '-', 430, currentY, {
        width: 40,
        lineBreak: false,
      });

      doc.text(item.prog !== null ? String(item.prog) : '-', 480, currentY, {
        width: 40,
        lineBreak: false,
      });

      currentY += ROW_HEIGHT;
    }

    currentY += 10;

    if (currentY + 20 > doc.page.height - FOOTER_SPACE) {
      doc.addPage();

      this.drawHeader(doc, data);

      currentY = CONTENT_START_Y;
    }

    doc
      .font('Helvetica-Bold')
      .fontSize(10)
      .text(`Total de itens: ${data.servicos.length}`, 40, currentY);
  }

  private drawTableHeader(doc: PdfDocumentType, y: number) {
    doc.rect(40, y, 515, 20).fill('#D9EAF7');

    doc.fillColor('black');

    doc.font('Helvetica-Bold').fontSize(9);

    doc.text('Código', 45, y + 5);
    doc.text('Descrição', 110, y + 5);
    doc.text('Operação', 340, y + 5);
    doc.text('Ponto', 430, y + 5);
    doc.text('Prog', 480, y + 5);
    doc.text('Real', 520, y + 5);
  }

  private drawFieldCard(
    doc: PdfDocumentType,
    x: number,
    y: number,
    width: number,
    label: string,
    value: string,
  ) {
    doc.rect(x, y, width, 42).stroke(CARD_BORDER_COLOR);

    doc
      .fillColor(LABEL_COLOR)
      .font('Helvetica-Bold')
      .fontSize(8)
      .text(label, x + 8, y + 6);

    doc
      .fillColor(VALUE_COLOR)
      .font('Helvetica')
      .fontSize(10)
      .text(value || '-', x + 8, y + 18);
  }
}
