import { TipoUsuario } from 'src/domain/entities/user.entity';

export type AuthLoginInput = {
  username: string;
  password: string;
};

export type AuthLoginOutput = {
  id: number;
  username: string;
  id_regional: number;
  nome_usuario: string;
  email: string;
  access_token: string;
  is_admin: boolean;
  permissao_edicao: boolean;
  id_turma: number;
  id_area: number;
  tipo_usuario: TipoUsuario;
};

export type RegisterUserInput = {
  username: string;
  senha?: string;
  nome: string;
  email: string;
  tipo_usuario: TipoUsuario;
  is_admin?: boolean;
  permissao_edicao?: boolean;
  id_regional: number;
  id_turma: number;
  id_area?: number;
};
