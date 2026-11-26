import { UsersService } from 'src/application/usecases/users.service';

import { UsersController } from 'src/interface/controllers/users.controller';

import { Test, TestingModule } from '@nestjs/testing';

describe('UsersControllers', () => {
  let usersController: UsersController;

  beforeEach(async () => {
    vi.resetAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: { updatePassword: vi.fn() } },
      ],
    }).compile();

    usersController = moduleRef.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(usersController).toBeDefined();
  });

  // it('should call UsersService.updatePassword and return the result', async () => {
  //   const params: ChangePasswordDTO = {
  //     token: 'token',
  //     newPassword: 'newPassword',
  //   };

  //   const result = new User({
  //     id: 1,
  //     username: 'teste123',
  //     senha: 'newPassword',
  //   });

  //   vi.spyOn(UsersService, 'updatePassword').mockResolvedValue(result);

  //   expect(await usersController.changePassword(params)).toStrictEqual({
  //     statusCode: HttpStatus.OK,
  //     message: 'Senha alterada com sucesso',
  //     data: plainToInstance(changePasswordResponseDTO, result),
  //   });
  //   expect(UsersService.updatePassword).toHaveBeenCalledWith(
  //     params.token,
  //     params.newPassword,
  //   );
  // });
});
