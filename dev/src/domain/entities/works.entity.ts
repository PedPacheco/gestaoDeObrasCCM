import { BadRequestException } from '@nestjs/common';

export class Work {
  constructor(
    public readonly obra: string,
    public readonly pep: string,
    public readonly entrada: Date,
    public readonly prazoTexto: string,
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
    entrada: Date,
    prazoTexto: string,
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
    id?: number,
  ) {
    super(
      obra,
      pep,
      entrada,
      prazoTexto,
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
    if (this.entrada != null) updateData.entrada = this.entrada;
    if (this.idMunicipio != null) updateData.id_gpm = this.idMunicipio;
    if (this.idTipo != null) updateData.id_tipo = this.idTipo;
    if (this.idCircuito != null) updateData.id_circuito = this.idCircuito;
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
      data.entrada,
      data.prazoTexto,
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
      data.id,
    );
  }
}

export class NoteWorks extends Work {
  constructor(
    obra: string,
    pep: string,
    entrada: Date,
    prazoTexto: string,
    equipeNumPedido: string,
    idMunicipio: number,
    idTipo: number,
    idParceira: number,
    idCircuito: number,
    public readonly dci: string,
    public readonly dcd: string,
    public readonly dca: string,
    public readonly dcim: string,
    public readonly referencia: string,
    public readonly qtdePlanejada: number,
    public readonly moPlanejada: number,
    public readonly idEmpreendimento: number,
    public readonly idGrupo: number,
    public readonly capexMoPlan: number,
    public readonly capexMatPlan: number,
    public readonly anoPlan: number,
    id?: number,
  ) {
    super(
      obra,
      pep,
      entrada,
      prazoTexto,
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
    if (this.pep != null) updateData.pep = this.pep;
    if (this.entrada != null) updateData.entrada = this.entrada;
    if (this.equipeNumPedido != null)
      updateData.referencia = this.equipeNumPedido;
    if (this.idMunicipio != null) updateData.id_gpm = this.idMunicipio;
    if (this.idTipo != null) updateData.id_tipo = this.idTipo;
    if (this.idCircuito != null) updateData.id_circuito = this.idCircuito;

    if (this.dci != null) updateData.ordem_dci = this.dci;
    if (this.dcd != null) updateData.ordem_dcd = this.dcd;
    if (this.dca != null) updateData.ordem_dca = this.dca;
    if (this.dcim != null) updateData.ordem_dcim = this.dcim;

    if (this.referencia != null) updateData.referencia = this.referencia;
    if (this.qtdePlanejada != null) updateData.qtde_plan = this.qtdePlanejada;
    if (this.idEmpreendimento != null)
      updateData.id_empreendimento = this.idEmpreendimento;
    if (this.capexMoPlan != null) updateData.capex_mo_plan = this.capexMoPlan;
    if (this.capexMatPlan != null)
      updateData.capex_mat_plan = this.capexMatPlan;
    if (this.anoPlan != null) updateData.ano_plan = this.anoPlan;

    return updateData;
  }

  static create(props: {
    obra: string;
    pep: string;
    entrada: Date;
    prazoTexto: string;
    equipeNumPedido: string;
    idMunicipio: number;
    idTipo: number;
    idParceira: number;
    idCircuito: number;
    dci: string;
    dcd: string;
    dca: string;
    dcim: string;
    referencia: string;
    qtdePlanejada: number;
    moPlanejada: number;
    idEmpreendimento: number;
    idGrupo: number;
    capexMoPlan: number;
    capexMatPlan: number;
    anoPlan: number;
    id?: number;
  }): NoteWorks {
    const instance = new NoteWorks(
      props.obra,
      props.pep,
      props.entrada,
      props.prazoTexto,
      props.equipeNumPedido,
      props.idMunicipio,
      props.idTipo,
      props.idParceira,
      props.idCircuito,
      props.dci,
      props.dcd,
      props.dca,
      props.dcim,
      props.referencia,
      props.qtdePlanejada,
      props.moPlanejada,
      props.idEmpreendimento,
      props.idGrupo,
      props.capexMoPlan,
      props.capexMatPlan,
      props.anoPlan,
      props.id,
    );

    instance.validateNota();

    return instance;
  }

  get isPepGenericoNote(): boolean {
    return this.pep?.includes('X/003999');
  }

  get hasMoPlanejadaNote(): boolean {
    return this.moPlanejada != null && this.moPlanejada > 0;
  }

  get isEmpreendimentoInvalido(): boolean {
    return (
      (this.idGrupo === 3 || this.idGrupo === 4) && this.idEmpreendimento === 1
    );
  }

  validateNota(): void {
    if (this.isPepGenericoNote) {
      throw new BadRequestException(`Obra ${this.obra} está com PEP genérico.`);
    }

    if (!this.hasMoPlanejadaNote) {
      throw new BadRequestException(
        `Obra ${this.obra} não tem valor de Mão de Obra.`,
      );
    }

    if (this.isEmpreendimentoInvalido) {
      throw new BadRequestException(
        `Selecione um empreendimento válido para a obra ${this.obra}.`,
      );
    }
  }
}
