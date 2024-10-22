"use client";

import { userLoginSchema } from "@/validations/validationUserLogin";
import { zodResolver } from "@hookform/resolvers/zod";
import { ErrorMessage } from "@hookform/error-message";
import { Checkbox, TextField } from "@mui/material";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { ButtonComponent } from "../common/Button";
import nookies from "nookies";
import Link from "next/link";
import { useRouter } from "next/navigation";
import ErrorModal from "../common/ErrorModal";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";

type UserLoginSchema = z.infer<typeof userLoginSchema>;

interface LoginResponse {
  statusCode: number;
  message: string;
  data: {
    id: number;
    username: string;
    permissao: string;
    id_regional: string;
    nome_usuario: string;
    email: string;
  };
}

export function FormLogin() {
  const [showPassword, SetShowPassoword] = useState(false);
  const [error, setError] = useState<string | null>();
  const [isModalOpen, setIsModalOpen] = useState(false);

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
      const response = await fetch("http://localhost:3333/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          user,
          password,
        }),
        credentials: "include",
      });

      if (response.ok) {
        const res: LoginResponse = await response.json();

        nookies.set(null, "userInfo", JSON.stringify(res.data), {
          httpOnly: false,
          secure: process.env.NODE_ENV === "production",
          sameSite: "lax",
          path: "/",
        });

        router.push("/");
      } else {
        setError("Erro ao fazer login");
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
      <div className="flex flex-col items-center mb-16 w-[90%] sm:w-80">
        <div className="h-20 w-full">
          <TextField
            className="w-full mb-2"
            label="Digite seu usuário"
            {...register("user")}
          />
          <ErrorMessage
            errors={errors}
            name="user"
            render={({ message }) => <p className="text-red-700">{message}</p>}
          />
        </div>

        <div className="h-20 w-full">
          <TextField
            className="w-full mt-10 mb-2"
            label="Digite sua senha"
            {...register("password")}
            type={showPassword ? "text" : "password"}
          />
          <ErrorMessage
            errors={errors}
            name="password"
            render={({ message }) => <p className="text-red-700">{message}</p>}
          />
        </div>
      </div>

      <div className="mb-20 w-[90%] sm:w-80 flex flex-col">
        <div className="flex items-center self-end ml-32">
          <Checkbox
            className="text-zinc-700"
            onChange={() => SetShowPassoword(!showPassword)}
          />
          <p className="text-zinc-700">Exibir senha</p>
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
