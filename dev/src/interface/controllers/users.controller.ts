import { plainToInstance } from 'class-transformer';
import { UsersService } from 'src/application/usecases/users.service';
import { userChangePasswordController } from 'src/interface/types/userInterface';

import { Body, Controller, HttpStatus, Put, UseGuards } from '@nestjs/common';

import {
  ChangePasswordDTO,
  changePasswordResponseDTO,
} from '../dtos/changePasswordDto';
import { AreaViewGuard } from 'src/core/guards/newPermission.guard';

@Controller('user')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Put('/change-password')
  @UseGuards(AreaViewGuard())
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
