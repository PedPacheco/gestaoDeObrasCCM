import { TipoUsuario } from '@prisma/client';

export interface userInterface {
  id: number;
  username: string;
  senha: string;
  tipo_usuario: TipoUsuario;
  is_admin: boolean;
  permissao_edicao: boolean;
  id_turma: number;
  id_area: number;
  id_regional: number;
  nome: string;
  email: string;
}

export interface userChangePasswordController {
  statusCode: number;
  message: string;
  data: {
    id: number;
    username: string;
  };
}

export interface userRegisterInterfaceController {
  statusCode: number;
  message: string;
  data: {
    id: number;
    username: string;
  };
}

export interface loginInterfaceService {
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
}

export interface loginInterfaceController {
  statusCode: number;
  message: string;
  data: {
    id: number;
    username: string;
    id_regional: number;
    nome_usuario: string;
    email: string;
  };
}
