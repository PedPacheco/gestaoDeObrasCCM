import { IsNumber, IsOptional, IsString } from 'class-validator';

export class MaterialCapexDTO {
  @IsOptional()
  @IsString()
  status: string | null;

  @IsString()
  diagrama_rede: string;

  @IsString()
  def_proj: string;

  @IsString()
  material: string;

  @IsString()
  texto_material: string;

  @IsNumber()
  centro: number;

  @IsNumber()
  deposito: number;

  @IsString()
  ctg_item: string;

  @IsOptional()
  @IsString()
  elemento_pep: string | null;

  @IsString()
  um_registro: string;

  @IsNumber()
  preco_mi: number;

  @IsNumber()
  qtd_necess: number;

  @IsNumber()
  qtd_retirada: number;

  @IsNumber()
  qtd_recebida: number;

  @IsNumber()
  qtd_faltante: number;

  @IsString()
  data_necessidade: string;

  @IsString()
  relevancia_calculo: string;
}
