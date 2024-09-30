import { IsNotEmpty, IsString } from 'class-validator';

export class ChangePasswordDTO {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  newPassword: string;
}
