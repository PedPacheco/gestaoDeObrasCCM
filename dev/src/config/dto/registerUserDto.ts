import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class RegisterUserDTO {
  @IsNotEmpty()
  @IsString()
  @MaxLength(8)
  username: string;

  @IsString()
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
