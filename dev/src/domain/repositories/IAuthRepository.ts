import { User } from '../entities/user.entity';

export interface IAuthRepository {
  register({
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
