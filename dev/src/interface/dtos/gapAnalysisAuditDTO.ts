import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateGapAnalysisAuditDTO {
  @IsNotEmpty()
  @IsString()
  parceira: string;

  @IsOptional()
  @IsString()
  num_auditoria?: string;

  @IsOptional()
  @IsString()
  data_inicio?: string;

  @IsOptional()
  @IsString()
  data_fim?: string;

  @IsOptional()
  @IsString()
  gap_anterior?: string;

  @IsOptional()
  @IsString()
  gap_atual?: string;

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
  @IsString()
  plano_validado?: string;

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
  @IsString()
  quantidade_desvios_planejados?: string;

  @IsOptional()
  @IsString()
  quantidade_desvios_executados?: string;

  @IsOptional()
  @IsString()
  executados_fora_prazo?: string;

  @IsOptional()
  @IsString()
  itens_pendentes_fora_do_prazo?: string;

  @IsOptional()
  @IsString()
  observacao?: string;

  @IsOptional()
  @IsString()
  status?: string;
}

export class UpdateGapAnalysisAuditDTO {
  @IsOptional()
  @IsString()
  parceira?: string;

  @IsOptional()
  @IsString()
  num_auditoria?: string;

  @IsOptional()
  @IsString()
  data_inicio?: string;

  @IsOptional()
  @IsString()
  data_fim?: string;

  @IsOptional()
  @IsString()
  gap_anterior?: string;

  @IsOptional()
  @IsString()
  gap_atual?: string;

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
  @IsString()
  plano_validado?: string;

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
  @IsString()
  quantidade_desvios_planejados?: string;

  @IsOptional()
  @IsString()
  quantidade_desvios_executados?: string;

  @IsOptional()
  @IsString()
  executados_fora_prazo?: string;

  @IsOptional()
  @IsString()
  itens_pendentes_fora_do_prazo?: string;

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
