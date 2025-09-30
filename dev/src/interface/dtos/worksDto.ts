import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateIf,
} from 'class-validator';
import { convertParameterValue } from 'src/utils/convertParameterValue';

export class GetAllWorksDTO {
  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idRegional: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idMunicipio: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idGrupo: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idTipo: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idParceira: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idStatus: number[];

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page: number;

  @IsOptional()
  @IsBoolean()
  insufficientPermission: boolean;
}

export class GetWorksDTO {
  @IsOptional()
  @IsBoolean()
  insufficientPermission: boolean;

  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  page: number;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idRegional: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idMunicipio: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idGrupo: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idTipo: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idParceira: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idStatus: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idConjunto: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idCircuito: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idEmpreendimento: number[];

  @IsOptional()
  @IsString()
  ovnota: string;
}

export class UpdateWorkDTO {
  @IsNumber()
  @IsOptional()
  id_turma: number;

  @IsNumber()
  @IsOptional()
  id_status: number;

  @ValidateIf(
    (_, value) =>
      value === null || value instanceof Date || typeof value === 'string',
  )
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  data_empreitamento?: Date | null;

  @IsString()
  @IsOptional()
  @IsIn(['CONVENCIONAL', 'PONTO A PONTO'])
  tipo_ads: string;
}

export class ContractUpdateDTO {
  @IsString()
  @Transform(({ value }) => String(value))
  ovnota: string;

  @IsString()
  @Transform(({ value }) => String(value))
  ordemDiagrama: string;

  @IsDate()
  @Type(() => Date)
  dataEmpreitamento: Date;

  @IsString()
  @IsIn(['CONVENCIONAL', 'PONTO A PONTO'])
  tipoAds: string;
}

export class UpdateNotesDTO {
  @IsNotEmpty()
  @IsString()
  obra: string;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  entrada?: Date;

  @IsOptional()
  @IsString()
  prazo?: string;

  @IsString()
  referencia: string;

  @IsNotEmpty()
  @IsNumber()
  idMunicipio: number;

  @IsNotEmpty()
  @IsNumber()
  idEmpreendimento: number;

  @IsNotEmpty()
  @IsNumber()
  idTipo: number;

  @IsNotEmpty()
  @IsNumber()
  idTurma: number;

  @IsNotEmpty()
  @IsNumber()
  idCircuito: number;

  @IsNotEmpty()
  @IsNumber()
  anoplan?: number;

  @IsNotEmpty()
  @IsString()
  pep: string;

  @IsOptional()
  @IsString()
  ordem_dci?: string;

  @IsOptional()
  @IsString()
  ordem_dcd?: string;

  @IsOptional()
  @IsString()
  ordem_dca?: string;

  @IsOptional()
  @IsString()
  ordem_dcim?: string;

  @IsOptional()
  @IsNumber()
  moPlan?: number;

  @IsOptional()
  @IsNumber()
  qtdePlan?: number;

  @IsOptional()
  @IsNumber()
  capexMoPlan?: number;

  @IsOptional()
  @IsNumber()
  capexMatPlan?: number;
}

export class InsertMarketWorksDTO {
  @IsString()
  @IsNotEmpty()
  obra: string;

  @IsString()
  pep: string;

  @IsString()
  diagrama: string;

  @IsDate()
  @Type(() => Date)
  entrada: Date;

  @IsNumber()
  idMunicipio: number;

  @IsNumber()
  idTipo: number;

  @IsNumber()
  idCircuito: number;

  @IsNumber()
  idParceira: number;

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

  @IsString()
  observacao: string;
}

export class InsertNotesDTO {
  @IsNotEmpty()
  @IsString()
  obra: string;

  @IsDate()
  entrada: Date;

  @IsString()
  prazo: string;

  @IsString()
  referencia: string;

  @IsNotEmpty()
  @IsNumber()
  aux_gpm: number;

  @IsNotEmpty()
  @IsNumber()
  aux_empreendimento: number;

  @IsNotEmpty()
  @IsNumber()
  aux_tipo: number;

  @IsNotEmpty()
  @IsNumber()
  aux_turma: number;

  @IsNotEmpty()
  @IsNumber()
  aux_circuito: number;

  @IsNotEmpty()
  @IsNumber()
  aux_tecnico: number;

  @IsNumber()
  anoplan: number;
}
