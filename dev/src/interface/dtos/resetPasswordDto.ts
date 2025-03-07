import { IsNotEmpty, IsString } from 'class-validator';

export class ResetPasswordDTO {
  @IsNotEmpty()
  @IsString()
  username: string;
}
