"use client";

import { memo } from "react";
import { TableCell, TableRow } from "@mui/material";

import { AdminUser } from "@/types/adminUsers";
import {
  ADMIN_USERS_COLUMNS,
  AdminUsersTableRowContext,
} from "@/components/adminUsers/usersTable";

interface UsersTableRowProps {
  user: AdminUser;
  ctx: AdminUsersTableRowContext;
}

export const UsersTableRow = memo(function UsersTableRow({
  user,
  ctx,
}: UsersTableRowProps) {
  return (
    <TableRow hover>
      {ADMIN_USERS_COLUMNS.map((column) => (
        <TableCell
          key={column.key}
          className="py-2 px-3 text-center whitespace-nowrap"
        >
          {column.render(user, ctx)}
        </TableCell>
      ))}
    </TableRow>
  );
});
