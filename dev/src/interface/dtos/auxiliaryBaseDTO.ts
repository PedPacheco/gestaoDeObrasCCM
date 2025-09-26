import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class InsertBaseAuxiliaryMarketDTO {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => String(value))
  obra: string;

  @IsString()
  pep: string;

  @IsString()
  @Transform(({ value }) => String(value))
  diagrama: string;

  @IsDate()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      const [day, month, year] = value.split('.');
      return new Date(`${year}-${month}-${day}`);
    }
    return value;
  })
  entrada: Date;

  @IsString()
  gpm: string;

  @IsString()
  tipo: string;

  @IsString()
  circuito: string;

  @IsString()
  prazoTexto: string;

  @IsNumber()
  statusOv: number;

  @IsString()
  statusDiagrama: string;

  @IsString()
  statusPep: string;

  @IsString()
  equipeNumPedido: string;

  @IsNumber()
  moCliente: number;

  @IsNumber()
  moEmpresa: number;
}

export class NotesDTO {
  @IsString()
  campo_ordenacao: string;

  @IsString()
  pep: string;

  @IsString()
  ordem_dci: string;

  @IsString()
  ordem_dcd: string;

  @IsString()
  ordem_dca: string;

  @IsString()
  ordem_dcim: string;

  @IsString()
  conjunto: string;

  @IsString()
  texto_breve: string;

  @IsString()
  grp_plnj_pm: string;

  @IsString()
  denominacao: string;
}

class MaterialDTO {
  @IsString()
  diagrama_rede: string;

  @IsString()
  ctg_item: string;

  @IsString()
  um_registro: string;

  @IsString()
  texto_material: string;

  @IsNumber()
  qtd_necess: number;

  @IsNumber()
  preco_mi: number;

  @IsString()
  material: string;

  @IsString()
  def_proj: string;
}

export class InsertBaseAuxiliaryNotesDTO {
  @ValidateNested({ each: true })
  @Type(() => NotesDTO)
  notesData: NotesDTO;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => MaterialDTO)
  materialData: MaterialDTO[];
}
