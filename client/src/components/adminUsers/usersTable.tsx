"use client";

import { ReactNode, useEffect, useState } from "react";
import dayjs from "dayjs";
import {
  FormControlLabel,
  Paper,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
} from "@mui/material";

import { AdminUser } from "@/types/adminUsers";
import { ButtonComponent } from "@/components/common/Button";
import { UsersTableRow } from "@/components/adminUsers/usersTableRow";

export interface AdminUsersTableRowContext {
  isMutating: boolean;
  currentUserId?: number;
  onDeactivate: (user: AdminUser) => void;
  onReactivate: (user: AdminUser) => void;
  onArchive: (user: AdminUser) => void;
  onTogglePermission: (user: AdminUser, permissaoEdicao: boolean) => void;
}

export interface AdminUsersTableColumn {
  key: string;
  label: string;
  render: (user: AdminUser, ctx: AdminUsersTableRowContext) => ReactNode;
}

function formatUltimoAcesso(value: string | null): string {
  return value ? dayjs(value).format("DD/MM/YYYY") : "-";
}

function getStatusLabel(user: AdminUser): string {
  if (user.ativo) return "Ativo";
  if (user.desativado_por_inatividade) return "Desativado por inatividade";
  return "Desativado";
}

export const ADMIN_USERS_COLUMNS: AdminUsersTableColumn[] = [
  { key: "username", label: "Usuário", render: (user) => user.username },
  { key: "nome", label: "Nome", render: (user) => user.nome },
  { key: "email", label: "E-mail", render: (user) => user.email },
  { key: "tipo_usuario", label: "Tipo", render: (user) => user.tipo_usuario },
  { key: "regional", label: "Regional", render: (user) => user.regional ?? "-" },
  { key: "parceira", label: "Parceira", render: (user) => user.parceira ?? "-" },
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
    label: "Pode editar",
    render: (user, ctx) => (
      <FormControlLabel
        className="!ml-0"
        control={
          <Switch
            checked={user.permissao_edicao}
            disabled={ctx.isMutating}
            onChange={(event) =>
              ctx.onTogglePermission(user, event.target.checked)
            }
          />
        }
        label="Pode editar"
        labelPlacement="bottom"
      />
    ),
  },
  {
    key: "status",
    label: "Status",
    render: (user) => (
      <span
        className={
          user.ativo
            ? "text-green-700 font-medium"
            : "text-red-600 font-medium"
        }
      >
        {getStatusLabel(user)}
      </span>
    ),
  },
  {
    key: "acoes",
    label: "Ações",
    render: (user, ctx) => {
      if (user.ativo) {
        return (
          <ButtonComponent
            text="Desativar"
            onClick={() => ctx.onDeactivate(user)}
            disabled={ctx.isMutating || user.id === ctx.currentUserId}
          />
        );
      }

      if (user.desativado_por_inatividade) {
        return (
          <div className="flex gap-2 justify-center">
            <ButtonComponent
              text="Reativar"
              onClick={() => ctx.onReactivate(user)}
              disabled={ctx.isMutating}
            />
            <ButtonComponent
              text="Excluir"
              onClick={() => ctx.onArchive(user)}
              disabled={ctx.isMutating}
            />
          </div>
        );
      }

      return (
        <ButtonComponent
          text="Reativar"
          onClick={() => ctx.onReactivate(user)}
          disabled={ctx.isMutating}
        />
      );
    },
  },
];

interface UsersTableProps {
  users: AdminUser[];
  isLoading: boolean;
  isMutating: boolean;
  currentUserId?: number;
  onDeactivate: (user: AdminUser) => void;
  onReactivate: (user: AdminUser) => void;
  onArchive: (user: AdminUser) => void;
  onTogglePermission: (user: AdminUser, permissaoEdicao: boolean) => void;
}

const ROWS_PER_PAGE = 10;

export function UsersTable({
  users,
  isLoading,
  isMutating,
  currentUserId,
  onDeactivate,
  onReactivate,
  onArchive,
  onTogglePermission,
}: UsersTableProps) {
  const [page, setPage] = useState(0);

  // Sempre que a lista filtrada mudar, volta para a primeira página para
  // evitar que o usuário fique preso numa página vazia.
  useEffect(() => {
    setPage(0);
  }, [users]);

  if (isLoading) {
    return <p className="text-center py-8">Carregando usuários...</p>;
  }

  if (users.length === 0) {
    return <p className="text-center py-8">Nenhum usuário encontrado.</p>;
  }

  const paginatedUsers = users.slice(
    page * ROWS_PER_PAGE,
    page * ROWS_PER_PAGE + ROWS_PER_PAGE,
  );

  const ctx: AdminUsersTableRowContext = {
    isMutating,
    currentUserId,
    onDeactivate,
    onReactivate,
    onArchive,
    onTogglePermission,
  };

  return (
    <Paper className="w-full flex flex-col">
      <div className="w-full overflow-x-auto">
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {ADMIN_USERS_COLUMNS.map((column) => (
                  <TableCell
                    key={column.key}
                    className="py-2 px-3 text-center text-zinc-700 font-semibold bg-[#53FF75] whitespace-nowrap"
                  >
                    {column.label}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedUsers.map((user) => (
                <UsersTableRow key={user.id} user={user} ctx={ctx} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </div>

      <div className="bg-white border-t">
        <TablePagination
          component="div"
          count={users.length}
          page={page}
          rowsPerPage={ROWS_PER_PAGE}
          rowsPerPageOptions={[]}
          onPageChange={(_, newPage) => setPage(newPage)}
          labelDisplayedRows={({ from, to, count }) =>
            `${from}–${to} de ${count}`
          }
        />
      </div>
    </Paper>
  );
}
