"use client";

import { AdminUser } from "@/types/adminUsers";
import { ButtonComponent } from "@/components/common/Button";

interface UsersTableProps {
  users: AdminUser[];
  isLoading: boolean;
  isMutating: boolean;
  currentUsername?: string;
  onDeactivate: (user: AdminUser) => void;
}

export function UsersTable({
  users,
  isLoading,
  isMutating,
  currentUsername,
  onDeactivate,
}: UsersTableProps) {
  if (isLoading) {
    return <p className="text-center py-8">Carregando usuários...</p>;
  }

  if (users.length === 0) {
    return <p className="text-center py-8">Nenhum usuário encontrado.</p>;
  }

  return (
    <div className="overflow-x-auto w-full">
      <table className="w-full text-sm text-left">
        <thead className="bg-[#212E3E] text-zinc-200">
          <tr>
            <th className="p-3">Usuário</th>
            <th className="p-3">Nome</th>
            <th className="p-3">E-mail</th>
            <th className="p-3">Tipo</th>
            <th className="p-3">Admin</th>
            <th className="p-3">Status</th>
            <th className="p-3">Ações</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => (
            <tr key={user.id} className="border-b border-zinc-200">
              <td className="p-3">{user.username}</td>
              <td className="p-3">{user.nome}</td>
              <td className="p-3">{user.email}</td>
              <td className="p-3">{user.tipo_usuario}</td>
              <td className="p-3">{user.is_admin ? "Sim" : "Não"}</td>
              <td className="p-3">
                <span
                  className={
                    user.ativo
                      ? "text-green-700 font-medium"
                      : "text-red-600 font-medium"
                  }
                >
                  {user.ativo ? "Ativo" : "Inativo"}
                </span>
              </td>
              <td className="p-3">
                <ButtonComponent
                  text="Desativar"
                  onClick={() => onDeactivate(user)}
                  disabled={
                    isMutating ||
                    !user.ativo ||
                    user.username === currentUsername
                  }
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
