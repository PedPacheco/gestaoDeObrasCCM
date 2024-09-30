import { userInterface } from 'src/types/userInterface';
import { Body, Controller, Put } from '@nestjs/common';
import { UsersService } from './users.service';
import { Public } from '../../config/costants';
import { ChangePasswordDTO } from 'src/config/dto/changePasswordDto';

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
