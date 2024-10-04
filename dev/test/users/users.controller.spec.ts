import { Test, TestingModule } from '@nestjs/testing';
import { ChangePasswordDTO } from 'src/config/dto/changePasswordDto';
import { UsersController } from 'src/modules/users/users.controller';
import { UsersService } from 'src/modules/users/users.service';

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
    const result = { id: 1, username: 'teste123', senha: 'newPassword' };

    jest.spyOn(usersService, 'updatePassword').mockResolvedValue(result);

    expect(await usersController.changePassword(params)).toBe(result);
    expect(usersService.updatePassword).toHaveBeenCalledWith(
      params.token,
      params.newPassword,
    );
  });
});
