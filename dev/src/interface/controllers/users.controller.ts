import { plainToInstance } from 'class-transformer';
import { UsersService } from 'src/application/usecases/users.service';
import {
  userChangePasswordController,
  userListInterfaceController,
  userAdminCreateInterfaceController,
  userStatusChangeInterfaceController,
} from 'src/interface/types/userInterface';

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';

import {
  ChangePasswordDTO,
  changePasswordResponseDTO,
} from '../dtos/changePasswordDto';
import {
  AreaEditGuard,
  AreaViewGuard,
} from 'src/core/guards/newPermission.guard';
import { RegisterUserDTO } from '../dtos/registerUserDto';
import { UpdateUserDTO, UserSafeResponseDTO } from '../dtos/userDTO';

@Controller('user')
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @UseGuards(AreaViewGuard({ adminOnly: true }))
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
  @UseGuards(AreaEditGuard({ adminOnly: true }))
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

  @Put('/change-password')
  @UseGuards(AreaEditGuard({ adminOnly: true }))
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

  @Patch('/:id/ativar')
  @UseGuards(AreaEditGuard({ adminOnly: true }))
  async updateStatus(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<userStatusChangeInterfaceController> {
    const user = await this.usersService.updateStatus(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Usuário reativado com sucesso',
      data: plainToInstance(UserSafeResponseDTO, user, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Patch('/:id')
  @UseGuards(AreaEditGuard({ adminOnly: true }))
  async updateUser(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateUserDTO,
  ): Promise<userStatusChangeInterfaceController> {
    const user = await this.usersService.updateUser(id, data);

    return {
      statusCode: HttpStatus.OK,
      message: 'Permissão do usuário atualizada com sucesso',
      data: plainToInstance(UserSafeResponseDTO, user, {
        excludeExtraneousValues: true,
      }),
    };
  }
}
