import { UsersService } from 'src/domain/services/users.service';
import { userChangePasswordController } from 'src/interface/types/userInterface';

import { Body, Controller, HttpStatus, Put } from '@nestjs/common';
import { plainToInstance } from 'class-transformer';
import {
  ChangePasswordDTO,
  changePasswordResponseDTO,
} from '../dtos/changePasswordDto';

@Controller('user')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Put('/change-password')
  async changePassword(
    @Body() { token, newPassword }: ChangePasswordDTO,
  ): Promise<userChangePasswordController> {
    const user = await this.usersService.updatePassword(token, newPassword);

    return {
      statusCode: HttpStatus.OK,
      message: 'Senha alterada com sucesso',
      data: plainToInstance(changePasswordResponseDTO, user),
    };
  }
}
