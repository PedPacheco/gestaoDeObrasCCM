"use client";

import { useState, MouseEvent } from "react";
import {
  Menu,
  MenuItem,
  IconButton,
  ListItemIcon,
  ListItemText,
} from "@mui/material";
import {
  EllipsisVerticalIcon,
  NoSymbolIcon,
  ArrowPathIcon,
} from "@heroicons/react/20/solid";

import { AdminUser, UserActionType } from "@/types/adminUsers";

interface AdminUsersRowActionsProps {
  user: AdminUser;
  isMutating: boolean;
  currentUserId?: number;
  onAction: (user: AdminUser, action: UserActionType) => void;
}

export function AdminUsersRowActions({
  user,
  isMutating,
  currentUserId,
  onAction,
}: AdminUsersRowActionsProps) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const isSelf = user.id === currentUserId;

  function handleOpen(event: MouseEvent<HTMLElement>) {
    event.stopPropagation();
    setAnchorEl(event.currentTarget);
  }

  function handleClose() {
    setAnchorEl(null);
  }

  function handleSelect(action: UserActionType) {
    onAction(user, action);
    handleClose();
  }

  return (
    <>
      <IconButton
        onClick={handleOpen}
        disabled={isMutating}
        aria-label="Ações"
        aria-controls={open ? "user-actions-menu" : undefined}
        aria-haspopup="true"
      >
        <EllipsisVerticalIcon width={22} height={22} />
      </IconButton>

      <Menu
        id="user-actions-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
      >
        {user.ativo ? (
          <MenuItem
            disabled={isSelf}
            onClick={() => handleSelect("deactivate")}
          >
            <ListItemIcon>
              <NoSymbolIcon width={18} height={18} />
            </ListItemIcon>
            <ListItemText>Desativar</ListItemText>
          </MenuItem>
        ) : (
          <MenuItem onClick={() => handleSelect("reactivate")}>
            <ListItemIcon>
              <ArrowPathIcon width={18} height={18} />
            </ListItemIcon>
            <ListItemText>Reativar</ListItemText>
          </MenuItem>
        )}
      </Menu>
    </>
  );
}
