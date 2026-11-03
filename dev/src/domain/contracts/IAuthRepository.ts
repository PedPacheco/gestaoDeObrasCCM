import { User } from '../entities/user.entity';

export interface IAuthRepository {
  register({
    username,
    senha,
    is_admin,
    nome,
    permissao_edicao,
    tipo_usuario,
    id_area,
    id_regional,
    id_turma,
    email,
  }: User): Promise<User>;
}

export const AUTH_REPOSITORY = Symbol('AuthRepository');
