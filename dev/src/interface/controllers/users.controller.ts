import { plainToInstance } from 'class-transformer';
import { UsersService } from 'src/application/usecases/users.service';
import {
  userChangePasswordController,
  userListInterfaceController,
  userAdminCreateInterfaceController,
  userDeactivateInterfaceController,
} from 'src/interface/types/userInterface';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Put,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ChangePasswordDTO,
  changePasswordResponseDTO,
} from '../dtos/changePasswordDto';
import { AreaViewGuard } from 'src/core/guards/newPermission.guard';
import { AdminPanelGuard } from 'src/core/guards/adminPanelGuard';
import { RegisterUserDTO } from '../dtos/registerUserDto';
import { UserSafeResponseDTO } from '../dtos/userSafeResponseDto';

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

  @Get()
  @UseGuards(AdminPanelGuard())
  async list(): Promise<userListInterfaceController> {
    const users = await this.usersService.listUsers();

    return {
      statusCode: HttpStatus.OK,
      message: 'Usuários listados com sucesso',
      data: users.map((user) =>
        plainToInstance(UserSafeResponseDTO, user, {
          excludeExtraneousValues: true,
        }),
      ),
    };
  }

  @Post()
  @UseGuards(AdminPanelGuard())
  async create(
    @Body() dto: RegisterUserDTO,
  ): Promise<userAdminCreateInterfaceController> {
    const user = await this.usersService.createUser(dto);

    return {
      statusCode: HttpStatus.CREATED,
      message: 'Usuário cadastrado com sucesso',
      data: plainToInstance(UserSafeResponseDTO, user, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Delete('/:id')
  @UseGuards(AdminPanelGuard())
  async deactivate(
    @Param('id') id: string,
    @Req() req: any,
  ): Promise<userDeactivateInterfaceController> {
    const user = await this.usersService.deactivateUser(+id, req.user.sub);

    return {
      statusCode: HttpStatus.OK,
      message: 'Usuário desativado com sucesso',
      data: plainToInstance(UserSafeResponseDTO, user, {
        excludeExtraneousValues: true,
      }),
    };
  }
}
