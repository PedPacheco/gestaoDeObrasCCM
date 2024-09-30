import { IsNotEmpty, IsString } from 'class-validator';

export class LoginUserDTO {
  @IsString()
  @IsNotEmpty()
  user: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
