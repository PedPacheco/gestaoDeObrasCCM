import { RegisterUserDTO } from 'src/interface/dtos/registerUserDto';

export class UserEntity {
  id: number;
  username: string;
  senha: string;
  permissao: string;
  id_regional: number;
  nome_usuario: string;
  email: string;
  permissao_visualizacao?: string;

  constructor(data: Partial<RegisterUserDTO>) {
    this.username = data.username;
    this.senha = data.senha;
    this.permissao = data.permissao;
    this.id_regional = data.id_regional;
    this.nome_usuario = data.nome_usuario;
    this.email = data.email;
    this.permissao_visualizacao = data.permissao_visualizacao;
  }
}
