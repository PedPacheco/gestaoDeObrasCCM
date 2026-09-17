import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateUserPermissionDTO {
  @IsNotEmpty()
  @IsBoolean()
  permissao_edicao: boolean;
}
