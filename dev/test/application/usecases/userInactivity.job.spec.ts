import { Test, TestingModule } from '@nestjs/testing';
import { Logger } from '@nestjs/common';
import { UserInactivityJob } from 'src/application/usecases/userInactivity.job';
import { UsersService } from 'src/application/usecases/users.service';

const mockUsersService = {
  deactivateInactiveUsers: jest.fn(),
};

describe('UserInactivityJob', () => {
  let userInactivityJob: UserInactivityJob;

  beforeEach(async () => {
    jest.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserInactivityJob,
        {
          provide: UsersService,
          useValue: mockUsersService,
        },
      ],
    }).compile();

    userInactivityJob = module.get<UserInactivityJob>(UserInactivityJob);
  });

  describe('handleInactiveUsersDeactivation', () => {
    it('should call usersService.deactivateInactiveUsers and log the result', async () => {
      mockUsersService.deactivateInactiveUsers.mockResolvedValue(4);

      const logSpy = jest.spyOn(Logger.prototype, 'log').mockImplementation();

      await userInactivityJob.handleInactiveUsersDeactivation();

      expect(mockUsersService.deactivateInactiveUsers).toHaveBeenCalled();
      expect(logSpy).toHaveBeenCalledWith(
        '4 usuário(s) desativado(s) por inatividade',
      );

      logSpy.mockRestore();
    });
  });
});
