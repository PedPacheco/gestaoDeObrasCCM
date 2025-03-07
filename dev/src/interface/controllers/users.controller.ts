import { UsersService } from 'src/domain/services/users.service';
import { ChangePasswordDTO } from 'src/interface/dtos/changePasswordDto';
import { userInterface } from 'src/interface/types/userInterface';

import { Body, Controller, Put } from '@nestjs/common';

import { Public } from '../../shared/costants';

@Controller('user')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Public()
  @Put('/change-password')
  async changePassword(
    @Body() { token, newPassword }: ChangePasswordDTO,
  ): Promise<userInterface> {
    return this.usersService.updatePassword(token, newPassword);
  }
}
