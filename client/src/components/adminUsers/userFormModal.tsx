"use client";

import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox, FormControlLabel, MenuItem, TextField } from "@mui/material";

import ModalComponent from "@/components/common/Modal";
import { ButtonComponent } from "@/components/common/Button";
import {
  CreateAdminUserFormData,
  createAdminUserSchema,
} from "@/validations/validationAdminUser";
import { CreateAdminUserPayload } from "@/types/adminUsers";
import { FiltersInterface } from "@/types/filtersInterfaces";

interface UserFormModalProps {
  open: boolean;
  isMutating: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateAdminUserPayload) => void;
  filters: FiltersInterface;
}

export function UserFormModal({
  open,
  isMutating,
  onClose,
  onSubmit,
  filters,
}: UserFormModalProps) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<CreateAdminUserFormData>({
    resolver: zodResolver(createAdminUserSchema),
    defaultValues: {
      is_admin: false,
      permissao_edicao: false,
      tipo_usuario: "INTERNO",
    },
  });

  const tipoUsuario = watch("tipo_usuario");

  function handleClose() {
    reset();
    onClose();
  }

  function handleFormSubmit(data: CreateAdminUserFormData) {
    onSubmit(data as CreateAdminUserPayload);
  }

  return (
    <ModalComponent open={open} onClose={handleClose} title="Novo usuário">
      <form
        onSubmit={handleSubmit(handleFormSubmit)}
        className="flex flex-col gap-4 pb-4"
      >
        <TextField
          label="Usuário"
          {...register("username")}
          error={!!errors.username}
          helperText={errors.username?.message}
        />

        <TextField
          label="Senha"
          type="password"
          {...register("senha")}
          error={!!errors.senha}
          helperText={errors.senha?.message}
        />

        <TextField
          label="Nome"
          {...register("nome")}
          error={!!errors.nome}
          helperText={errors.nome?.message}
        />

        <TextField
          label="E-mail"
          {...register("email")}
          error={!!errors.email}
          helperText={errors.email?.message}
        />

        <Controller
          name="tipo_usuario"
          control={control}
          render={({ field }) => (
            <TextField {...field} select label="Tipo de usuário">
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
          />
        )}

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

        <div className="flex justify-center gap-4 mt-2">
          <ButtonComponent
            text="Cancelar"
            onClick={handleClose}
            type="button"
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
