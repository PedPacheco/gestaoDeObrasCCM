export class User {
  id?: number;
  username: string;
  senha: string;
  permissao?: string;
  id_regional?: number;
  id_turma?: number;
  nome_usuario?: string;
  email?: string;
  permissao_visualizacao?: string;

  constructor(data: Partial<User>) {
    Object.assign(this, data);
  }
}
