import { TipoUsuario } from 'src/domain/entities/user.entity';

export interface UserRecord {
  id: number;
  username: string;
  nome: string;
  email: string;
  tipo_usuario: TipoUsuario;
  is_admin: boolean;
  permissao_edicao: boolean;
  ativo: boolean;
  id_regional: number;
  id_turma: number;
  id_area: number | null; // o RegisterUserInput tem id_area?, por isso é provável que aceite null. Confirme no schema
}

/** Só para autenticação. Nunca deve chegar ao controller. */
export interface UserWithPasswordRecord extends UserRecord {
  senha: string;
}

export interface UserListItemRecord extends UserRecord {
  regional: string | null;
  turma: string | null;
  area: string | null;
}
