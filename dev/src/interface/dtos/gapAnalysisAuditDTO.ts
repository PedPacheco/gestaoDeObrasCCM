import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsDate,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class GapAnalysisAuditDTO {
  @IsNotEmpty()
  @IsNumber()
  id_parceira: number;

  @IsOptional()
  @IsNumber()
  num_auditoria?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  data_inicio?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  data_fim?: Date;

  @IsOptional()
  @IsNumber()
  gap_anterior?: number;

  @IsOptional()
  @IsNumber()
  gap_atual?: number;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  apresentacao_interna?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  reuniao_apresentacao?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  notificacao_gestao?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  retorno_parceira?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  validacao_plano_edp?: Date;

  @IsOptional()
  @IsBoolean()
  plano_validado?: boolean;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  devolutiva_novo_plano?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  validacao_novo_plano?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  lancamento_desvios_sgs?: Date;

  @IsOptional()
  @IsDate()
  @Type(() => Date)
  inicio_acompanhamento?: Date;

  @IsOptional()
  @IsNumber()
  quantidade_desvios_planejados?: number;

  @IsOptional()
  @IsNumber()
  quantidade_desvios_executados?: number;

  @IsOptional()
  @IsNumber()
  executados_fora_prazo?: number;

  @IsOptional()
  @IsNumber()
  itens_pendentes_fora_do_prazo?: number;

  @IsOptional()
  @IsString()
  observacao?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class CreateManyGapAnalysisAuditDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GapAnalysisAuditDTO)
  items: GapAnalysisAuditDTO[];
}
