"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox, FormControlLabel, MenuItem, TextField } from "@mui/material";

import ModalComponent from "@/components/common/Modal";
import { ButtonComponent } from "@/components/common/Button";
import {
  CreateUserFormData,
  createUserSchema,
} from "@/validations/validationUser";
import { AdminUser, UserPayload } from "@/types/adminUsers";
import { FiltersInterface } from "@/types/filtersInterfaces";

interface UserFormModalProps {
  open: boolean;
  isMutating: boolean;
  onClose: () => void;
  onCreate: (payload: UserPayload) => void;
  onUpdate: (id: number, payload: UserPayload) => void;
  filters: FiltersInterface;
  user?: AdminUser | null;
}

function FormSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="border-l-2 border-[#53FF75] pl-4">
      <h3 className="text-sm font-semibold text-zinc-500 mb-3">{title}</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">{children}</div>
    </div>
  );
}

export function UserFormModal({
  open,
  isMutating,
  onClose,
  onCreate,
  onUpdate,
  filters,
  user,
}: UserFormModalProps) {
  const isEditing = !!user;

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateUserFormData>({
    resolver: zodResolver(createUserSchema),
    defaultValues: {
      is_admin: false,
      permissao_edicao: false,
      tipo_usuario: "INTERNO",
    },
  });

  const tipoUsuario = watch("tipo_usuario");

  useEffect(() => {
    if (!open) return;

    if (user) {
      reset({
        username: user.username,
        nome: user.nome,
        email: user.email,
        tipo_usuario: user.tipo_usuario,
        id_regional: user.id_regional ?? undefined,
        id_turma: user.id_turma ?? undefined,
        id_area: user.id_area ?? undefined,
        is_admin: user.is_admin,
        permissao_edicao: user.permissao_edicao,
        senha: "",
      });
    } else {
      reset({
        username: "",
        nome: "",
        email: "",
        senha: "",
        tipo_usuario: "INTERNO",
        id_regional: undefined,
        id_turma: undefined,
        id_area: undefined,
        is_admin: false,
        permissao_edicao: false,
      });
    }
  }, [open, user, reset]);

  function handleClose() {
    reset();
    onClose();
  }

  function handleFormSubmit(data: CreateUserFormData) {
    if (isEditing && user) {
      const { senha, ...rest } = data;
      const payload: UserPayload = {
        ...rest,
        ...(senha ? { senha } : {}),
      };
      onUpdate(user.id, payload);
    } else {
      onCreate(data as UserPayload);
    }
  }

  return (
    <ModalComponent
      open={open}
      onClose={handleClose}
      title={isEditing ? "Editar usuário" : "Novo usuário"}
      width="w-[920px]"
    >
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-6 pb-4 "
      >
        <FormSection title="Credenciais de acesso">
          <TextField
            label="Usuário"
            {...register("username")}
            error={!!errors.username}
            helperText={errors.username?.message}
            disabled={isEditing}
            fullWidth
          />

          <TextField
            label={isEditing ? "Nova senha (opcional)" : "Senha"}
            type="password"
            {...register("senha")}
            error={!!errors.senha}
            helperText={
              errors.senha?.message ??
              (isEditing
                ? "Deixe em branco para manter a senha atual"
                : undefined)
            }
            fullWidth
          />
        </FormSection>

        <FormSection title="Dados pessoais">
          <TextField
            label="Nome"
            {...register("nome")}
            error={!!errors.nome}
            helperText={errors.nome?.message}
            fullWidth
          />

          <TextField
            label="E-mail"
            {...register("email")}
            error={!!errors.email}
            helperText={errors.email?.message}
            fullWidth
          />
        </FormSection>

        <FormSection title="Acesso e permissões">
          <Controller
            name="tipo_usuario"
            control={control}
            render={({ field }) => (
              <TextField {...field} select label="Tipo de usuário" fullWidth>
                <MenuItem value="INTERNO">Interno</MenuItem>
                <MenuItem value="PARCEIRA">Parceira</MenuItem>
              </TextField>
            )}
          />

          <Controller
            name="id_regional"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Regional"
                value={field.value ?? ""}
                onChange={(event) => field.onChange(Number(event.target.value))}
                error={!!errors.id_regional}
                helperText={errors.id_regional?.message}
                fullWidth
              >
                {(filters.regional ?? []).map((item) => (
                  <MenuItem key={item.id} value={Number(item.id)}>
                    {item.regional}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          <Controller
            name="id_turma"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                select
                label="Turma / Parceira"
                value={field.value ?? ""}
                onChange={(event) => field.onChange(Number(event.target.value))}
                error={!!errors.id_turma}
                helperText={errors.id_turma?.message}
                fullWidth
              >
                {(filters.parceira ?? []).map((item) => (
                  <MenuItem key={item.id} value={Number(item.id)}>
                    {item.turma}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />

          {tipoUsuario === "INTERNO" && (
            <TextField
              label="Área"
              type="number"
              {...register("id_area", { valueAsNumber: true })}
              error={!!errors.id_area}
              helperText={errors.id_area?.message}
              fullWidth
            />
          )}

          <div className="sm:col-span-2 flex flex-col sm:flex-row gap-1 sm:gap-6 bg-zinc-50 rounded-md px-4 py-2">
            <Controller
              name="is_admin"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label="Administrador"
                />
              )}
            />

            <Controller
              name="permissao_edicao"
              control={control}
              render={({ field }) => (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={field.value}
                      onChange={(e) => field.onChange(e.target.checked)}
                    />
                  }
                  label="Permissão de edição"
                />
              )}
            />
          </div>
        </FormSection>

        <div className="flex justify-end gap-3 mt-2 border-t border-zinc-200 pt-4">
          <ButtonComponent
            text="Cancelar"
            onClick={handleClose}
            type="button"
            styled="!bg-transparent !text-zinc-600 hover:!bg-zinc-100"
          />
          <ButtonComponent
            text={isMutating ? "Salvando..." : "Salvar"}
            type="submit"
            disabled={isMutating}
          />
        </div>
      </form>
    </ModalComponent>
  );
}
