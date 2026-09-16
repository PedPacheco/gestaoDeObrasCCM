"use client";

import { useState } from "react";
import {
  Paper,
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

interface UsersTableProps {
  users: AdminUser[];
  isLoading: boolean;
  isMutating: boolean;
  currentUsername?: string;
  onDeactivate: (user: AdminUser) => void;
  onReactivate: (user: AdminUser) => void;
  onTogglePermission: (user: AdminUser) => void;
}

const ROWS_PER_PAGE = 10;

const COLUMNS = [
  "Usuário",
  "Nome",
  "E-mail",
  "Tipo",
  "Regional",
  "Parceira",
  "Área",
  "Admin",
  "Visualização/Edição",
  "Status",
  "Ações",
];

export function UsersTable({
  users,
  isLoading,
  isMutating,
  currentUsername,
  onDeactivate,
  onReactivate,
  onTogglePermission,
}: UsersTableProps) {
  const [page, setPage] = useState(0);

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

  return (
    <Paper className="w-full flex flex-col">
      <div className="w-full overflow-x-auto">
        <TableContainer>
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {COLUMNS.map((column) => (
                  <TableCell
                    key={column}
                    className="py-2 px-3 text-center text-zinc-700 font-semibold bg-[#53FF75] whitespace-nowrap"
                  >
                    {column}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>

            <TableBody>
              {paginatedUsers.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell className="py-2 px-3 text-center whitespace-nowrap">
                    {user.username}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-center whitespace-nowrap">
                    {user.nome}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-center whitespace-nowrap">
                    {user.email}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-center whitespace-nowrap">
                    {user.tipo_usuario}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-center whitespace-nowrap">
                    {user.regional ?? "-"}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-center whitespace-nowrap">
                    {user.parceira ?? "-"}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-center whitespace-nowrap">
                    {user.area ?? "-"}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-center whitespace-nowrap">
                    {user.is_admin ? "Sim" : "Não"}
                  </TableCell>
                  <TableCell className="py-2 px-3 text-center whitespace-nowrap">
                    <ButtonComponent
                      text={
                        user.permissao_edicao ? "Edição" : "Visualização"
                      }
                      onClick={() => onTogglePermission(user)}
                      disabled={isMutating}
                    />
                  </TableCell>
                  <TableCell className="py-2 px-3 text-center whitespace-nowrap">
                    <span
                      className={
                        user.ativo
                          ? "text-green-700 font-medium"
                          : "text-red-600 font-medium"
                      }
                    >
                      {user.ativo ? "Ativo" : "Inativo"}
                    </span>
                  </TableCell>
                  <TableCell className="py-2 px-3 text-center whitespace-nowrap">
                    {user.ativo ? (
                      <ButtonComponent
                        text="Desativar"
                        onClick={() => onDeactivate(user)}
                        disabled={
                          isMutating || user.username === currentUsername
                        }
                      />
                    ) : (
                      <ButtonComponent
                        text="Reativar"
                        onClick={() => onReactivate(user)}
                        disabled={isMutating}
                      />
                    )}
                  </TableCell>
                </TableRow>
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
