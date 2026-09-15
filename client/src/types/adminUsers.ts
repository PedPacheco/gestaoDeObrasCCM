export type TipoUsuarioAdmin = "INTERNO" | "PARCEIRA";

export interface AdminUser {
  id: number;
  username: string;
  nome: string;
  email: string;
  tipo_usuario: TipoUsuarioAdmin;
  is_admin: boolean;
  permissao_edicao: boolean;
  id_regional: number;
  id_turma: number;
  id_area: number | null;
  ativo: boolean;
}

export interface CreateAdminUserPayload {
  username: string;
  senha: string;
  nome: string;
  email: string;
  tipo_usuario: TipoUsuarioAdmin;
  is_admin: boolean;
  permissao_edicao: boolean;
  id_regional: number;
  id_turma: number;
  id_area?: number;
}
