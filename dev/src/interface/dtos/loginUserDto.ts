import { Exclude, Expose } from 'class-transformer';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDTO {
  @IsString()
  @IsNotEmpty()
  user: string;

  @IsString()
  @IsNotEmpty()
  password: string;
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
}
