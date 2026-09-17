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
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Req,
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
import { UpdateUserPermissionDTO } from '../dtos/updateUserPermissionDto';
import { UserSafeResponseDTO } from '../dtos/userSafeResponseDto';

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

  @Delete('/:id')
  @UseGuards(AreaEditGuard({ adminOnly: true }))
  async deactivate(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<userStatusChangeInterfaceController> {
    const user = await this.usersService.deactivateUser(id, req.user.sub);

    return {
      statusCode: HttpStatus.OK,
      message: 'Usuário desativado com sucesso',
      data: plainToInstance(UserSafeResponseDTO, user, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Patch('/:id/reactivate')
  @UseGuards(AreaEditGuard({ adminOnly: true }))
  async reactivate(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<userStatusChangeInterfaceController> {
    const user = await this.usersService.reactivateUser(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Usuário reativado com sucesso',
      data: plainToInstance(UserSafeResponseDTO, user, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Patch('/:id/permission')
  @UseGuards(AreaEditGuard({ adminOnly: true }))
  async updatePermission(
    @Param('id', ParseIntPipe) id: number,
    @Body() { permissao_edicao }: UpdateUserPermissionDTO,
  ): Promise<userStatusChangeInterfaceController> {
    const user = await this.usersService.changeUserPermission(
      id,
      permissao_edicao,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Permissão do usuário atualizada com sucesso',
      data: plainToInstance(UserSafeResponseDTO, user, {
        excludeExtraneousValues: true,
      }),
    };
  }

  @Patch('/:id/archive')
  @UseGuards(AreaEditGuard({ adminOnly: true }))
  async archive(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ): Promise<userStatusChangeInterfaceController> {
    const user = await this.usersService.archiveUser(id, req.user.sub);

    return {
      statusCode: HttpStatus.OK,
      message: 'Usuário excluído com sucesso',
      data: plainToInstance(UserSafeResponseDTO, user, {
        excludeExtraneousValues: true,
      }),
    };
  }
}
