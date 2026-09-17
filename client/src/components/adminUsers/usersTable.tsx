"use client";

import { ReactNode } from "react";
import dayjs from "dayjs";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

import { AdminUser, UserActionType } from "@/types/adminUsers";
import { AdminUsersRowActions } from "./adminUsersRowActions";

export interface AdminUsersTableRowContext {
  isMutating: boolean;
  currentUserId?: number;
  onAction: (user: AdminUser, action: UserActionType) => void;
}

export interface AdminUsersTableColumn {
  key: string;
  label: string;
  render: (user: AdminUser, ctx: AdminUsersTableRowContext) => ReactNode;
}

function formatUltimoAcesso(value: string | null): string {
  return value ? dayjs(value).format("DD/MM/YYYY HH:mm") : "-";
}

function getStatusLabel(user: AdminUser): string {
  return user.ativo ? "Ativo" : "Desativado";
}

export const ADMIN_USERS_COLUMNS: AdminUsersTableColumn[] = [
  { key: "username", label: "Usuário", render: (user) => user.username },
  { key: "nome", label: "Nome", render: (user) => user.nome },
  { key: "email", label: "E-mail", render: (user) => user.email },
  { key: "tipo_usuario", label: "Tipo", render: (user) => user.tipo_usuario },
  {
    key: "regional",
    label: "Regional",
    render: (user) => user.regional ?? "-",
  },
  {
    key: "parceira",
    label: "Parceira",
    render: (user) => user.parceira ?? "-",
  },
  { key: "area", label: "Área", render: (user) => user.area ?? "-" },
  {
    key: "is_admin",
    label: "Admin",
    render: (user) => (user.is_admin ? "Sim" : "Não"),
  },
  {
    key: "ultimo_acesso",
    label: "Último acesso",
    render: (user) => formatUltimoAcesso(user.ultimo_acesso),
  },
  {
    key: "permissao_edicao",
    label: "Leitura/Edição",
    render: (user) => (user.permissao_edicao ? "Edição" : "Leitura"),
  },
  {
    key: "status",
    label: "Status",
    render: (user) => (
      <span
        className={
          user.ativo ? "text-green-700 font-medium" : "text-red-600 font-medium"
        }
      >
        {getStatusLabel(user)}
      </span>
    ),
  },
  {
    key: "acoes",
    label: "Ações",
    render: (user, ctx) => (
      <AdminUsersRowActions
        user={user}
        isMutating={ctx.isMutating}
        currentUserId={ctx.currentUserId}
        onAction={ctx.onAction}
      />
    ),
  },
];

interface UsersTableProps {
  users: AdminUser[];
  isLoading: boolean;
  isMutating: boolean;
  currentUserId?: number;
  onAction: (user: AdminUser, action: UserActionType) => void;
}

export function UsersTable({
  users,
  isLoading,
  isMutating,
  currentUserId,
  onAction,
}: UsersTableProps) {
  if (isLoading) {
    return <p className="text-center py-8">Carregando usuários...</p>;
  }

  if (users.length === 0) {
    return <p className="text-center py-8">Nenhum usuário encontrado.</p>;
  }

  const ctx: AdminUsersTableRowContext = {
    isMutating,
    currentUserId,
    onAction,
  };

  return (
    <TableContainer
      component={Paper}
      className="w-full min-h-96 h-[820px] flex-1 mb-6 xl:mb-0"
    >
      <Table stickyHeader className="overflow-y-auto">
        <TableHead>
          <TableRow>
            {ADMIN_USERS_COLUMNS.map((column) => (
              <TableCell
                key={column.key}
                className="py-2 text-center text-zinc-700 text-lg font-semibold bg-[#53FF75] whitespace-nowrap"
              >
                {column.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {users.map((user) => (
            <TableRow
              hover
              key={user.id}
              onClick={() => onAction(user, "edit")}
              sx={{ cursor: "pointer" }}
            >
              {ADMIN_USERS_COLUMNS.map((column) => (
                <TableCell
                  key={column.key}
                  className="py-1 px-0 text-center whitespace-nowrap"
                  onClick={
                    column.key === "acoes"
                      ? (e) => e.stopPropagation()
                      : undefined
                  }
                >
                  {column.render(user, ctx)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
