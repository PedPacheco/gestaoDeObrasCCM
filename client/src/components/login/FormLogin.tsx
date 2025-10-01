"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUser } from "@/contexts/userContext";
import { userLoginSchema } from "@/validations/validationUserLogin";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import { zodResolver } from "@hookform/resolvers/zod";
import { Checkbox, TextField } from "@mui/material";

import { ButtonComponent } from "../common/Button";
import ErrorModal from "../common/ErrorModal";

type UserLoginSchema = z.infer<typeof userLoginSchema>;

export function FormLogin() {
  const [showPassword, SetShowPassoword] = useState(false);
  const [error, setError] = useState<string | null>();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const { login } = useUser();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserLoginSchema>({
    resolver: zodResolver(userLoginSchema),
  });

  async function handleUserLogin({ user, password }: UserLoginSchema) {
    try {
      const response = await login(user, password);

      if (response.success) {
        router.push("/");
      } else {
        setError(response.message);
        setIsModalOpen(true);
      }
    } catch (error: any) {
      setError("Ocorreu um erro durante o login.");
      setIsModalOpen(true);
    }
  }
  return (
    <form
      onSubmit={handleSubmit(handleUserLogin)}
      className="w-full flex flex-col items-center"
    >
      <div className="flex flex-col items-center mb-12 w-[90%] sm:w-80">
        <div className="h-20 w-full">
          <TextField
            className="w-full mb-2"
            label="Digite seu usuário"
            {...register("user")}
            error={!!errors.user}
            helperText={errors.user?.message}
          />
        </div>

        <div className="h-20 w-full">
          <TextField
            className="w-full mt-10 mb-2"
            label="Digite sua senha"
            {...register("password")}
            type={showPassword ? "text" : "password"}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
        </div>
      </div>

      <div className="mb-20 w-[90%] sm:w-80 flex flex-col">
        <div className="flex items-center self-end ml-32">
          <Checkbox
            className="text-zinc-700"
            onChange={() => SetShowPassoword(!showPassword)}
          />
          <p className="text-zinc-700 text-nowrap">Exibir senha</p>
        </div>
        <ButtonComponent text="ENTRAR" type="submit" />

        <Link
          href="/login/forget-password"
          className="self-end mt-4 hover:text-[#53FF75]"
        >
          Esqueceu sua senha ?
        </Link>
      </div>

      {error && (
        <ErrorModal
          open={isModalOpen}
          message={error}
          onClose={() => setError(null)}
          icon={<ExclamationCircleIcon width={48} height={48} />}
        />
      )}
    </form>
  );
}
