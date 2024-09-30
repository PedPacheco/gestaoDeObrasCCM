import { IsNotEmpty, IsNumber, IsString, MaxLength } from 'class-validator';

export class RegisterUserDTO {
  @IsNotEmpty()
  @IsString()
  @MaxLength(8)
  username: string;

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
}
