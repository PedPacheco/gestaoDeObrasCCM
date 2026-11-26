import { UsersService } from 'src/application/usecases/users.service';
import { USER_REPOSITORY } from 'src/domain/contracts/IUserRepository';
import { TipoUsuario, User } from 'src/domain/entities/user.entity';

import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';

vi.mock('bcrypt', () => ({
  hash: vi.fn(),
  genSalt: vi.fn(),
}));

const mockUserRepository = {
  findByUsernameWithPassword: vi.fn(),
  updatePassword: vi.fn(),
};

const mockJwtService = {
  sign: vi.fn(),
  verify: vi.fn(),
};

describe('UsersService', () => {
  let usersService: UsersService;
  // let jwtService: JwtService;

  const fixedDate = new Date('2026-09-18T12:00:00.000Z');

  const mockUser = {
    id: 1,
    username: 'teste123',
    senha: 'hashPassword',
    nome: 'teste',
    email: 'teste@gmail.com',
    tipo_usuario: TipoUsuario.INTERNO,
    is_admin: false,
    permissao_edicao: false,
    id_regional: 1,
    id_turma: 1,
    id_area: 8,
    ativo: true,
    ultimo_acesso: fixedDate,
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: USER_REPOSITORY,
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    usersService = module.get<UsersService>(UsersService);
    // jwtService = module.get<JwtService>(JwtService);
  });

  describe('findByUsernameWithPassword', () => {
    it('should return a user if found', async () => {
      const userData = { ...mockUser };

      mockUserRepository.findByUsernameWithPassword.mockResolvedValue(userData);

      const user = await usersService.findUser('testuser');
      expect(user).toEqual(User.restore(userData));
      expect(
        mockUserRepository.findByUsernameWithPassword,
      ).toHaveBeenCalledWith('testuser');
    });

    it('should return null if no user is found', async () => {
      mockUserRepository.findByUsernameWithPassword.mockResolvedValue(null);

      const user = await usersService.findUser('nonexistentuser');
      expect(user).toBeNull();
      expect(
        mockUserRepository.findByUsernameWithPassword,
      ).toHaveBeenCalledWith('nonexistentuser');
    });
  });
});
