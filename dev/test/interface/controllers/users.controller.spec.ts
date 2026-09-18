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
import { UpdateUserDTO } from 'src/interface/dtos/userDTO';

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
            updateStatus: jest.fn(),
            updateUser: jest.fn(),
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

  it('should call UsersService.reactivateUser with the parsed id', async () => {
    const safeUser = { id: 2, ativo: true };
    jest.spyOn(usersService, 'updateStatus').mockResolvedValue(safeUser);

    const response = await usersController.updateStatus(2);

    expect(usersService.updateStatus).toHaveBeenCalledWith(2);
    expect(response.statusCode).toBe(HttpStatus.OK);
  });

  it('should call UsersService.updateUser with the id and the body value', async () => {
    const safeUser: UpdateUserDTO = {
      id_regional: 2,
      id_turma: 3,
      is_admin: false,
      permissao_edicao: true,
    } as UpdateUserDTO;

    const response = await usersController.updateUser(2, safeUser);

    expect(usersService.updateUser).toHaveBeenCalledWith(2, safeUser);
    expect(response.statusCode).toBe(HttpStatus.OK);
  });
});
