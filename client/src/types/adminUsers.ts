export type TipoUsuarioAdmin = "INTERNO" | "PARCEIRA";

export type UserActionType = "edit" | "deactivate" | "reactivate";

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
}

export interface UserPayload {
  username: string;
  senha?: string;
  nome: string;
  email: string;
  tipo_usuario: TipoUsuarioAdmin;
  is_admin: boolean;
  permissao_edicao: boolean;
  id_regional: number;
  id_turma: number;
  id_area?: number;
}

export type AdminUserStatusFilter = "Todos" | "Ativos" | "Desativados";

export const ADMIN_USER_STATUS_OPTIONS: AdminUserStatusFilter[] = [
  "Todos",
  "Ativos",
  "Desativados",
];

export interface AdminUsersAppliedFilters {
  nome: string;
  regionais: string[];
  parceiras: string[];
  status: AdminUserStatusFilter;
}
