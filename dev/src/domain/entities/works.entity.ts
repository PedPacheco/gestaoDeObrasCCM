import { BadRequestException } from '@nestjs/common';

export class Work {
  constructor(
    public readonly obra: string,
    public readonly pep: string,
    public readonly equipeNumPedido: string,
    public readonly idMunicipio: number,
    public readonly idTipo: number,
    public readonly idParceira: number,
    public readonly idCircuito: number,
    public readonly id?: number,
  ) {}
}

export class MarketWork extends Work {
  constructor(
    obra: string,
    pep: string,
    equipeNumPedido: string,
    idMunicipio: number,
    idTipo: number,
    idParceira: number,
    idCircuito: number,
    public readonly diagrama: string,
    public readonly observacao: string,
    public readonly statusOv: number,
    public readonly statusDiagrama: string,
    public readonly statusPep: string,
    public readonly moCliente: number,
    public readonly moEmpresa: number,
    public readonly entrada: Date,
    public readonly prazoTexto: string,
    id?: number,
  ) {
    super(
      obra,
      pep,
      equipeNumPedido,
      idMunicipio,
      idTipo,
      idParceira,
      idCircuito,
      id,
    );
  }

  get referencia(): string {
    return this.equipeNumPedido?.substring(0, 14);
  }

  get prazo(): number {
    return parseInt(this.prazoTexto?.substring(12, 15)) || 0;
  }

  get moPlanejada(): number {
    return this.moCliente + this.moEmpresa;
  }

  get prazoTotal(): Date {
    const data = new Date(this.entrada);
    data.setDate(data.getDate() + this.prazo);
    return data;
  }

  toPrismaUpdate(): Partial<MarketWork> {
    const updateData: any = { id: this.id };

    updateData.ovnota = this.obra;
    if (this.pep != null) updateData.pep = this.pep;
    if (this.diagrama != null) updateData.diagrama = this.diagrama;
    if (this.idMunicipio != null) updateData.id_gpm = this.idMunicipio;
    if (this.idTipo != null) updateData.id_tipo = this.idTipo;
    if (this.idCircuito != null) updateData.id_circuito = this.idCircuito;
    if (this.idParceira != null) updateData.id_turma = this.idParceira;
    if (this.prazoTexto != null) updateData.prazo = this.prazo;
    if (this.statusOv != null) updateData.status_ov = this.statusOv;
    if (this.statusDiagrama != null)
      updateData.status_diagrama = this.statusDiagrama;
    if (this.statusPep != null) updateData.status_pep = this.statusPep;
    if (this.equipeNumPedido != null) updateData.referencia = this.referencia;
    if (this.moCliente !== null && this.moEmpresa !== null)
      updateData.moPlanejada = this.moPlanejada;

    return updateData;
  }

  static create(data: Partial<MarketWork>): MarketWork {
    return new MarketWork(
      data.obra,
      data.pep,
      data.equipeNumPedido,
      data.idMunicipio,
      data.idTipo,
      data.idParceira,
      data.idCircuito,
      data.diagrama,
      data.observacao,
      data.statusOv,
      data.statusDiagrama,
      data.statusPep,
      data.moCliente,
      data.moEmpresa,
      data.entrada,
      data.prazoTexto,
      data.id,
    );
  }
}

export class NoteWorks extends Work {
  constructor(
    obra: string,
    pep: string,
    equipeNumPedido: string,
    idMunicipio: number,
    idTipo: number,
    idParceira: number,
    idCircuito: number,
    public readonly idEmpreendimento: number,
    public readonly idGrupo: number,
    public readonly dci?: string,
    public readonly dcd?: string,
    public readonly dca?: string,
    public readonly dcim?: string,
    public readonly qtdePlanejada?: number,
    public readonly moPlanejada?: number,
    public readonly anoPlan?: number,
    public readonly entrada?: Date,
    public readonly prazoTexto?: string,
    public readonly ehRda?: boolean,
    id?: number,
  ) {
    super(
      obra,
      pep,
      equipeNumPedido,
      idMunicipio,
      idTipo,
      idParceira,
      idCircuito,
      id,
    );
  }

  toPrismaUpdate(): Partial<any> {
    const updateData: any = { id: this.id };

    updateData.ovnota = this.obra;
    updateData.mo_plan = this.moPlanejada;
    updateData.id_tipo = this.idTipo;
    if (this.pep != null) updateData.pep = this.pep;
    if (this.equipeNumPedido != null)
      updateData.referencia = this.equipeNumPedido;
    if (this.idMunicipio != null) updateData.id_gpm = this.idMunicipio;
    if (this.idCircuito != null) updateData.id_circuito = this.idCircuito;
    if (this.idParceira != null) updateData.id_turma = this.idParceira;
    if (this.dci != null && this.dci !== '') updateData.ordem_dci = this.dci;
    if (this.dcd != null && this.dcd !== '') updateData.ordem_dcd = this.dcd;
    if (this.dca != null && this.dca !== '') updateData.ordem_dca = this.dca;
    if (this.dcim != null && this.dcim !== '')
      updateData.ordem_dcim = this.dcim;
    if (this.qtdePlanejada != null) updateData.qtde_plan = this.qtdePlanejada;
    if (this.idEmpreendimento != null)
      updateData.id_empreendimento = this.idEmpreendimento;
    if (this.anoPlan != null) updateData.ano_plan = this.anoPlan;

    return updateData;
  }

  static create(props: {
    obra: string;
    pep: string;
    equipeNumPedido: string;
    idMunicipio: number;
    idTipo: number;
    idParceira: number;
    idCircuito: number;
    idEmpreendimento: number;
    idGrupo: number;
    dci?: string;
    dcd?: string;
    dca?: string;
    dcim?: string;
    qtdePlanejada?: number;
    moPlanejada?: number;
    anoPlan?: number;
    entrada?: Date;
    prazoTexto?: string;
    id?: number;
    ehRda?: boolean;
  }): NoteWorks {
    const instance = new NoteWorks(
      props.obra,
      props.pep,
      props.equipeNumPedido,
      props.idMunicipio,
      props.idTipo,
      props.idParceira,
      props.idCircuito,
      props.idEmpreendimento,
      props.idGrupo,
      props.dci,
      props.dcd,
      props.dca,
      props.dcim,
      props.qtdePlanejada,
      props.moPlanejada,
      props.anoPlan,
      props.entrada,
      props.prazoTexto,
      props.ehRda,
      props.id,
    );

    instance.validateNota();

    return instance;
  }

  get isPepGenericoNote(): boolean {
    return this.pep?.includes('X/003999');
  }

  get isEmpreendimentoInvalido(): boolean {
    return (
      (this.idGrupo === 3 || this.idGrupo === 4) && this.idEmpreendimento === 1
    );
  }

  get isAnoplanInvalid(): boolean {
    return (
      this.idGrupo === 2 &&
      (this.anoPlan == null || this.anoPlan.toString().length < 4)
    );
  }

  get isRda(): any {
    return this.idTipo !== 54 && this.idTipo !== 55 && this.ehRda;
  }

  get isTypeWorkInvalid(): boolean {
    return this.idTipo === 1;
  }

  get isCircuitInvalid(): boolean {
    return this.idCircuito === 1;
  }

  validateNota(): void {
    if (this.isPepGenericoNote) {
      throw new BadRequestException(`Obra ${this.obra} está com PEP genérico.`);
    }

    if (this.isEmpreendimentoInvalido) {
      throw new BadRequestException(
        `Selecione um empreendimento válido para a obra ${this.obra}.`,
      );
    }

    if (this.isAnoplanInvalid) {
      throw new BadRequestException('Falta informar o ano de Planejamento');
    }

    if (this.isRda) {
      throw new BadRequestException('Necessário selecionar o tipo da RDA');
    }

    if (this.isTypeWorkInvalid) {
      throw new BadRequestException('Selecione um tipo de obra');
    }

    if (this.isCircuitInvalid) {
      throw new BadRequestException('Selecione um circuito');
    }
  }
}
