import { User } from '../entities/user.entity';

export abstract class IAuthRepository {
  abstract register({
    username,
    senha,
    permissao,
    id_regional,
    email,
    nome_usuario,
    permissao_visualizacao,
  }: User): Promise<User>;
}

export const AUTH_REPOSITORY = Symbol('AuthRepository');
