import {
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { convertParameterValue } from 'src/utils/convertParameterValue';

export class IndicatorsDTO {
  @IsString()
  @IsOptional()
  dataInicial: string;

  @IsString()
  @IsOptional()
  dataFinal: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idParceira: number[];
}

export class CreateAdvancePartnerMonitoringDTO {
  @IsInt()
  @Type(() => Number)
  idParceira: number;

  @IsInt()
  @Type(() => Number)
  mesReferencia: number;

  @IsNumber()
  @Type(() => Number)
  procNumSemanasProg: number;

  @IsNumber()
  @Type(() => Number)
  procAderenciaElimRestr: number;

  @IsNumber()
  @Type(() => Number)
  procAderenciaProg: number;

  // Prazo

  @IsNumber()
  @Type(() => Number)
  prazoAderenciaExec: number;

  @IsNumber()
  @Type(() => Number)
  prazoMultas: number;

  @IsInt()
  @Type(() => Number)
  prazoBacklogVencidas: number;

  // Retrabalhos

  @IsInt()
  @Type(() => Number)
  retrTempoResolD5: number;

  @IsInt()
  @Type(() => Number)
  retrBacklogD5Qtd: number;

  @IsNumber()
  @Type(() => Number)
  retrBacklogD5Valor: number;

  @IsNumber()
  @Type(() => Number)
  retrTaxa: number;

  // WPA

  @IsInt()
  @Type(() => Number)
  wpaOciosidade: number;

  @IsInt()
  @Type(() => Number)
  wpaTmsSaidaBase: number;

  @IsNumber()
  @Type(() => Number)
  wpaOcupacao: number;

  @IsNumber()
  @Type(() => Number)
  wpaAderenciaDisp: number;

  // Clientes

  @IsInt()
  @Type(() => Number)
  cliEntradaReclamacoes: number;

  @IsNumber()
  @Type(() => Number)
  cliReclamacoesForaPrazo: number;

  @IsNumber()
  @Type(() => Number)
  cliProcedenciaReclamacoes: number;

  // Reflexões

  @IsString()
  procReflexao: string;

  @IsString()
  prazoReflexao: string;

  @IsString()
  retrReflexao: string;

  @IsString()
  wpaReflexao: string;

  @IsString()
  cliReflexao: string;
}
