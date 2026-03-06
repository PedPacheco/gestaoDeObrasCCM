import { plainToInstance } from 'class-transformer';
import { UsersService } from 'src/application/services/users.service';
import { User } from 'src/domain/entities/user.entity';
import { UsersController } from 'src/interface/controllers/users.controller';
import {
  ChangePasswordDTO,
  changePasswordResponseDTO,
} from 'src/interface/dtos/changePasswordDto';

import { HttpStatus } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';

describe('UsersControllers', () => {
  let usersController: UsersController;
  let usersService: UsersService;

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: { updatePassword: jest.fn() } },
      ],
    }).compile();

    usersController = moduleRef.get<UsersController>(UsersController);
    usersService = moduleRef.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(usersController).toBeDefined();
  });

  it('should call UsersService.updatePassword and return the result', async () => {
    const params: ChangePasswordDTO = {
      token: 'token',
      newPassword: 'newPassword',
    };

    const result = new User({
      id: 1,
      username: 'teste123',
      senha: 'newPassword',
    });

    jest.spyOn(usersService, 'updatePassword').mockResolvedValue(result);

    expect(await usersController.changePassword(params)).toStrictEqual({
      statusCode: HttpStatus.OK,
      message: 'Senha alterada com sucesso',
      data: plainToInstance(changePasswordResponseDTO, result),
    });
    expect(usersService.updatePassword).toHaveBeenCalledWith(
      params.token,
      params.newPassword,
    );
  });
});
