import { plainToInstance } from 'class-transformer';
import { UsersService } from 'src/application/usecases/users.service';
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
        {
          provide: UsersService,
          useValue: {
            updatePassword: jest.fn(),
            listUsers: jest.fn(),
            createUser: jest.fn(),
            deactivateUser: jest.fn(),
            reactivateUser: jest.fn(),
            changeUserPermission: jest.fn(),
            archiveUser: jest.fn(),
          },
        },
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

  it('should call UsersService.deactivateUser with the requester id and parsed target id', async () => {
    const safeUser = { id: 2, ativo: false };
    jest.spyOn(usersService, 'deactivateUser').mockResolvedValue(safeUser);

    const response = await usersController.deactivate(2, {
      user: { sub: 1 },
    } as any);

    expect(usersService.deactivateUser).toHaveBeenCalledWith(2, 1);
    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('should call UsersService.reactivateUser with the parsed id', async () => {
    const safeUser = { id: 2, ativo: true };
    jest.spyOn(usersService, 'reactivateUser').mockResolvedValue(safeUser);

    const response = await usersController.reactivate(2);

    expect(usersService.reactivateUser).toHaveBeenCalledWith(2);
    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('should call UsersService.changeUserPermission with the id and the body value', async () => {
    const safeUser = { id: 2, permissao_edicao: true };
    jest
      .spyOn(usersService, 'changeUserPermission')
      .mockResolvedValue(safeUser);

    const response = await usersController.updatePermission(2, {
      permissao_edicao: true,
    });

    expect(usersService.changeUserPermission).toHaveBeenCalledWith(2, true);
    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('should call UsersService.archiveUser with the requester id and parsed target id', async () => {
    const safeUser = { id: 2, excluido: true };
    jest.spyOn(usersService, 'archiveUser').mockResolvedValue(safeUser);

    const response = await usersController.archive(2, {
      user: { sub: 1 },
    } as any);

    expect(usersService.archiveUser).toHaveBeenCalledWith(2, 1);
    expect(response.statusCode).toBe(HttpStatus.OK);
  });
});
