import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  convertParameterValue,
  convertParameterValueForArray,
} from 'src/utils/convertParameterValue';

export const TIPOS_MAO_OBRA = [
  'Batedor (Técnico EDP)',
  'Viabilizador (Técnico EDP)',
  'Supervisor (a) (Parceira)',
  'Eletricista (Parceira)',
  'Não aplica Mão de Obra',
];

export const TIPOS_EQUIPE = ['L3', 'C1', 'C2', 'B1', 'B2', 'B3', 'B4'];

export const CSDS = [
  'Litoral',
  'São José dos Campos',
  'Taubaté - Guaratinguetá',
  'Mogi das Cruzes',
  'Suzano',
  'Guarulhos',
];

export class CreateContingencyDTO {
  @IsISO8601(
    {},
    { message: 'dia_disponibilidade deve ser uma data válida (YYYY-MM-DD)' },
  )
  dia_disponibilidade: string;

  @IsNumber()
  @IsNotEmpty()
  idParceira: number;

  @IsIn(TIPOS_MAO_OBRA, { message: 'Tipo de recurso - Mão de Obra inválido' })
  tipo_recurso_mao_obra: string;

  @Type(() => Number)
  @IsInt({ message: 'Quantidade de mão de obra deve ser um número inteiro' })
  @Min(0, { message: 'Quantidade de mão de obra deve ser maior ou igual a 0' })
  quantidade_mao_obra: number;

  @IsIn(TIPOS_EQUIPE, { message: 'Tipo de recurso - Por Equipe inválido' })
  tipo_recurso_equipe: string;

  @Type(() => Number)
  @IsInt({ message: 'Quantidade de equipe deve ser um número inteiro' })
  @Min(0, { message: 'Quantidade de equipe deve ser maior ou igual a 0' })
  quantidade_equipe: number;

  @IsIn(CSDS, { message: 'Disponibilizado ao CSD inválido' })
  disponibilizado_csd: string;

  @IsNumber()
  @IsNotEmpty()
  idUser: number;
}

// Filtros do dashboard (query params). Valores multivalorados chegam
// separados por vírgula (ex.: parceira=ENGELMIG,LIG) e são divididos no service.
export class DashboardFilterDTO {
  @IsString()
  @IsOptional()
  dataInicial?: string;

  @IsString()
  @IsOptional()
  dataFinal?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idParceira?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValueForArray(value))
  maoObra?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValueForArray(value))
  equipe?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValueForArray(value))
  csd?: string[];
}
