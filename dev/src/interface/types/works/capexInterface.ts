export interface materialsInterface {
  diagrama_rede: string;
  def_proj: string;
  material: string;
  texto_breve: string;
  centro: string;
  dep: string;
  cti: string;
  elemento_pep: string;
  und: string;
  preco: number;
  qtd_necessaria: number;
  qtd_retirada: number;
  qtd_falta: number;
  qtd_entrada: number;
  reserva: string;
  data_nec: Date;
}

export interface GetAuxiliaryBaseMaterialsInterface {
  ovnota: string;
  ordem_diagrama: string;
  diagrama_rede: string;
  def_proj: string;
  material: string;
  cti: string;
  preco: number;
  qtd_necessaria: number;
  qtd_retirada: number;
  qtd_falta: number;
  reserva: string;
  id_obra: number;
}
