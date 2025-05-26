export class Work {
  constructor(
    public readonly obra: string,
    public readonly pep: string,
    public readonly diagrama: string,
    public readonly entrada: Date,
    public readonly observacao: string,
    public readonly statusOv: number,
    public readonly statusDiagrama: number,
    public readonly statusPep: string,
    public readonly municipio: string,
    public readonly tipo: string,
    public readonly circuito: string,
    public readonly prazoTexto: string,
    public readonly tecnicoResp: string,
    public readonly equipeNumPedido: string,
    public readonly moCliente: number,
    public readonly moEmpresa: number,
  ) {}

  get referencia(): string {
    return this.equipeNumPedido?.substring(0, 14);
  }

  get prazo(): number {
    return parseInt(this.prazoTexto?.substring(12, 15)) || 0;
  }

  get moPlanejada(): number {
    return this.moCliente + this.moEmpresa;
  }
}
