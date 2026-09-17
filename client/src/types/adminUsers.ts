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
  parceira: string;
  regional: string;
  area: string;
  ultimo_acesso: string | null;
  desativado_por_inatividade: boolean;
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

export type AdminUserStatusFilter =
  | "Todos"
  | "Ativos"
  | "Desativados"
  | "Desativados por inatividade";

export const ADMIN_USER_STATUS_OPTIONS: AdminUserStatusFilter[] = [
  "Todos",
  "Ativos",
  "Desativados",
  "Desativados por inatividade",
];

export interface AdminUsersAppliedFilters {
  nome: string;
  regionais: string[];
  parceiras: string[];
  status: AdminUserStatusFilter;
}
