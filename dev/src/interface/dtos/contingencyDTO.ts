import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
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

export const TIPOS_EQUIPE = [
  'L3 - Cesto Linha Morta',
  'C1 - Cesto Linha Viva',
  'C2 - Cesto Linha Viva',
  'B1 - Caminhão guindauto',
  'B2 - Caminhão guindauto',
  'B3 - Caminhão guindauto',
  'B4 - Caminhão guindauto',
  'Não se aplica Equipe',
];

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
  @IsOptional()
  @IsISO8601(
    {},
    { message: 'dataInicial deve ser uma data válida (YYYY-MM-DD)' },
  )
  dataInicial?: string;

  @IsOptional()
  @IsISO8601({}, { message: 'dataFinal deve ser uma data válida (YYYY-MM-DD)' })
  dataFinal?: string;

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValue(value))
  idParceira?: number[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValueForArray(value))
  tipo_recurso_mao_obra?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValueForArray(value))
  tipo_recurso_equipe?: string[];

  @IsOptional()
  @IsArray()
  @Transform(({ value }) => convertParameterValueForArray(value))
  disponibilizado_csd?: string[];
}
