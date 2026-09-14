import { UsersService } from 'src/application/usecases/users.service';

import { UsersController } from 'src/interface/controllers/users.controller';

import { Test, TestingModule } from '@nestjs/testing';

describe('UsersControllers', () => {
  let usersController: UsersController;

  beforeEach(async () => {
    jest.resetAllMocks();

    const moduleRef: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        { provide: UsersService, useValue: { updatePassword: jest.fn() } },
      ],
    }).compile();

    usersController = moduleRef.get<UsersController>(UsersController);
  });

  it('should be defined', () => {
    expect(usersController).toBeDefined();
  });
});
