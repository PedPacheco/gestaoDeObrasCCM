import { Transform, Type } from 'class-transformer';
import {
  IsArray,
  IsIn,
  IsInt,
  IsISO8601,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Matches,
  Min,
  Validate,
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
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
  availabilityDate: string;

  @IsNumber()
  @IsNotEmpty()
  partnerId: number;

  @IsIn(TIPOS_MAO_OBRA, { message: 'Tipo de recurso - Mão de Obra inválido' })
  laborType: string;

  @Type(() => Number)
  @IsInt({ message: 'Quantidade de mão de obra deve ser um número inteiro' })
  @Min(0, { message: 'Quantidade de mão de obra deve ser maior ou igual a 0' })
  laborQuantity: number;

  @IsIn(TIPOS_EQUIPE, { message: 'Tipo de recurso - Por Equipe inválido' })
  teamType: string;

  @Type(() => Number)
  @IsInt({ message: 'Quantidade de equipe deve ser um número inteiro' })
  @Min(0, { message: 'Quantidade de equipe deve ser maior ou igual a 0' })
  teamQuantity: number;

  @IsIn(CSDS, { message: 'Disponibilizado ao CSD inválido' })
  allocatedCsd: string;

  @IsNumber()
  @IsNotEmpty()
  userId: number;
}

const MONTH_REGEX = /^\d{4}-(0[1-9]|1[0-2])$/;
const MONTH_MESSAGE = 'deve estar no formato YYYY-MM (ex.: 2026-01)';

@ValidatorConstraint({ name: 'monthRange' })
class MonthRangeConstraint implements ValidatorConstraintInterface {
  validate(mesFinal: string, args: ValidationArguments): boolean {
    const { mesInicial } = args.object as DashboardFilterDTO;
    // YYYY-MM pode ser comparado como texto
    return !mesInicial || !mesFinal || mesFinal >= mesInicial;
  }

  defaultMessage(): string {
    return 'mesFinal deve ser igual ou posterior a mesInicial';
  }
}

// Filtros do dashboard (query params). Valores multivalorados chegam
// separados por vírgula (ex.: parceira=ENGELMIG,LIG) e são divididos no service.
export class DashboardFilterDTO {
  @IsOptional()
  @Matches(MONTH_REGEX, { message: `mesInicial ${MONTH_MESSAGE}` })
  mesInicial?: string;

  @IsOptional()
  @Matches(MONTH_REGEX, { message: `mesFinal ${MONTH_MESSAGE}` })
  @Validate(MonthRangeConstraint)
  mesFinal?: string;

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
