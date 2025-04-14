import {
  IsLowercase,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUppercase,
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
  @IsUppercase()
  @IsLowercase()
  @Matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
  senha?: string;

  @IsNotEmpty()
  @IsString()
  permissao: string;

  @IsNotEmpty()
  @IsNumber()
  id_regional: number;

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
