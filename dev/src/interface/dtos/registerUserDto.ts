import { Exclude, Expose } from 'class-transformer';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RegisterUserDTO {
  @IsNotEmpty()
  @IsString()
  @MaxLength(8)
  username: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  senha?: string;

  @IsNotEmpty()
  @IsString()
  permissao: string;

  @IsNotEmpty()
  @IsNumber()
  id_regional: number;

  @IsNotEmpty()
  @IsNumber()
  id_turma: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  nome_usuario: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  email: string;

  @IsString()
  @IsOptional()
  permissao_visualizacao?: string;
}

@Exclude()
export class RegisterUserResponseDTO {
  @Expose()
  id: number;

  @Expose()
  username: string;
}
