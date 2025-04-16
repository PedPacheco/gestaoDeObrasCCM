import { IsNotEmpty, IsString } from 'class-validator';
import { Exclude, Expose } from 'class-transformer';

export class ChangePasswordDTO {
  @IsNotEmpty()
  @IsString()
  token: string;

  @IsNotEmpty()
  @IsString()
  newPassword: string;
}

@Exclude()
export class changePasswordResponseDTO {
  @Expose()
  id: number;

  @Expose()
  username: string;
}
