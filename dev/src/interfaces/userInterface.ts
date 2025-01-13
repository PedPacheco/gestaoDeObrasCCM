export interface userInterface {
  id: number;
  username: string;
  senha: string;
}

export interface userRegisterInterfaceService {
  id: number;
  username: string;
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
  permissao: string;
  id_regional: number;
  nome_usuario: string;
  email: string;
  permissao_visualizacao: string;
  access_token: string;
}

export interface loginInterfaceController {
  statusCode: number;
  message: string;
  data: {
    id: number;
    username: string;
    permissao: string;
    id_regional: number;
    nome_usuario: string;
    email: string;
  };
}
