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
