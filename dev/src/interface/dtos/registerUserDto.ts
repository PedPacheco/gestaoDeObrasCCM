import { TipoUsuario } from '@prisma/client';
import { Exclude, Expose } from 'class-transformer';
import {
  IsBoolean,
  IsEmail,
  IsEnum,
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
  @MaxLength(30)
  username: string;

  @IsString()
  @MinLength(8)
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, {
    message: 'A senha deve possuir letra maiúscula, minúscula e número',
  })
  senha?: string;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  nome: string;

  @IsNotEmpty()
  @IsEmail()
  @MaxLength(100)
  email: string;

  @IsNotEmpty()
  @IsEnum(TipoUsuario)
  tipo_usuario: TipoUsuario;

  @IsBoolean()
  @IsOptional()
  is_admin?: boolean = false;

  @IsBoolean()
  @IsOptional()
  permissao_edicao?: boolean = false;

  @IsNotEmpty()
  @IsNumber()
  id_regional: number;

  @IsNotEmpty()
  @IsNumber()
  id_turma: number;

  @IsNumber()
  @IsOptional()
  id_area?: number;
}

@Exclude()
export class RegisterUserResponseDTO {
  @Expose()
  id: number;

  @Expose()
  username: string;
}
