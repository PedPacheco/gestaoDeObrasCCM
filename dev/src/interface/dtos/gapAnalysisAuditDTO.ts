import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateGapAnalysisAuditDTO {
  @IsNotEmpty()
  @IsNumber()
  id_parceira: number;

  @IsOptional()
  @IsNumber()
  num_auditoria?: number;

  @IsOptional()
  @IsString()
  data_inicio?: string;

  @IsOptional()
  @IsString()
  data_fim?: string;

  @IsOptional()
  @IsNumber()
  gap_anterior?: number;

  @IsOptional()
  @IsNumber()
  gap_atual?: number;

  @IsOptional()
  @IsString()
  apresentacao_interna?: string;

  @IsOptional()
  @IsString()
  reuniao_apresentacao?: string;

  @IsOptional()
  @IsString()
  notificacao_gestao?: string;

  @IsOptional()
  @IsString()
  retorno_parceira?: string;

  @IsOptional()
  @IsString()
  validacao_plano_edp?: string;

  @IsOptional()
  @IsBoolean()
  plano_validado?: boolean;

  @IsOptional()
  @IsString()
  devolutiva_novo_plano?: string;

  @IsOptional()
  @IsString()
  validacao_novo_plano?: string;

  @IsOptional()
  @IsString()
  lancamento_desvios_sgs?: string;

  @IsOptional()
  @IsString()
  inicio_acompanhamento?: string;

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

export class UpdateGapAnalysisAuditDTO {
  @IsNotEmpty()
  @IsNumber()
  id_parceira: number;

  @IsOptional()
  @IsNumber()
  num_auditoria?: number;

  @IsOptional()
  @IsString()
  data_inicio?: string;

  @IsOptional()
  @IsString()
  data_fim?: string;

  @IsOptional()
  @IsNumber()
  gap_anterior?: number;

  @IsOptional()
  @IsNumber()
  gap_atual?: number;

  @IsOptional()
  @IsString()
  apresentacao_interna?: string;

  @IsOptional()
  @IsString()
  reuniao_apresentacao?: string;

  @IsOptional()
  @IsString()
  notificacao_gestao?: string;

  @IsOptional()
  @IsString()
  retorno_parceira?: string;

  @IsOptional()
  @IsString()
  validacao_plano_edp?: string;

  @IsOptional()
  @IsBoolean()
  plano_validado?: boolean;

  @IsOptional()
  @IsString()
  devolutiva_novo_plano?: string;

  @IsOptional()
  @IsString()
  validacao_novo_plano?: string;

  @IsOptional()
  @IsString()
  lancamento_desvios_sgs?: string;

  @IsOptional()
  @IsString()
  inicio_acompanhamento?: string;

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
  @Type(() => CreateGapAnalysisAuditDTO)
  items: CreateGapAnalysisAuditDTO[];
}
