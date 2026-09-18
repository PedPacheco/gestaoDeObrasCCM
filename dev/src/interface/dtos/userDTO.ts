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
import { TipoUsuario } from 'src/domain/entities/user.entity';

@Exclude()
export class RegisterUserResponseDTO {
  @Expose()
  id: number;

  @Expose()
  username: string;
}

@Exclude()
export class UserSafeResponseDTO {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  nome: string;

  @Expose()
  email: string;

  @Expose()
  tipo_usuario: TipoUsuario;

  @Expose()
  is_admin: boolean;

  @Expose()
  permissao_edicao: boolean;

  @Expose()
  id_regional: number;

  @Expose()
  id_turma: number;

  @Expose()
  id_area: number | null;

  @Expose()
  ativo: boolean;

  @Expose()
  ultimo_acesso: Date | null;

  @Expose()
  regional: string;

  @Expose()
  parceira: string;

  @Expose()
  area: string | null;
}

@Exclude()
export class LoginUserResponseDTO {
  @Expose()
  id: number;

  @Expose()
  username: string;

  @Expose()
  id_regional: number;

  @Expose()
  nome_usuario: string;

  @Expose()
  email: string;

  @Expose()
  tipo_usuario: string;

  @Expose()
  is_admin: boolean;

  @Expose()
  permissao_edicao: boolean;

  @Expose()
  id_turma: number;

  @Expose()
  id_area: number;
}

export class LoginUserDTO {
  @IsString()
  @IsNotEmpty()
  user: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}

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
  is_admin: boolean = false;

  @IsBoolean()
  permissao_edicao: boolean = false;

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

export class UpdateUserDTO {
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
  is_admin: boolean = false;

  @IsBoolean()
  permissao_edicao: boolean = false;

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
