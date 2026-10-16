"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

import { useUser } from "@/contexts/userContext";
import { useFeedback } from "@/hooks/useFeedback";
import { userLoginSchema } from "@/validations/validationUserLogin";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button, Checkbox, TextField } from "@mui/material";

import { ArrowPathIcon } from "@heroicons/react/20/solid";

type UserLoginSchema = z.infer<typeof userLoginSchema>;

const inputSx = {
  "& .MuiOutlinedInput-root": {
    borderRadius: "10px",
    backgroundColor: "#EEF4FB",
    "& fieldset": { borderColor: "#D5DFEC" },
    "&:hover fieldset": { borderColor: "#B4C4D9" },
    "&.Mui-focused fieldset": { borderColor: "#16B97D" },
  },
};

export function FormLogin() {
  const [showPassword, SetShowPassoword] = useState(false);

  const [loading, setLoading] = useState(false);

  const { showError } = useFeedback();

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
      setLoading(true);
      const response = await login(user, password);

      if (response.success) {
        router.push("/");
      } else {
        showError(response.message);
      }
    } catch (error: any) {
      showError("Ocorreu um erro durante o login.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <form
      onSubmit={handleSubmit(handleUserLogin)}
      className="w-full flex flex-col"
    >
      <div className="flex flex-col gap-5">
        <div>
          <label
            htmlFor="login-user"
            className="mb-2 block font-bold text-[#212E3E]"
          >
            Usuário
          </label>
          <TextField
            id="login-user"
            fullWidth
            placeholder="Digite seu usuário"
            {...register("user")}
            error={!!errors.user}
            helperText={errors.user?.message}
            sx={inputSx}
          />
        </div>

        <div>
          <label
            htmlFor="login-password"
            className="mb-2 block font-bold text-[#212E3E]"
          >
            Senha
          </label>
          <TextField
            id="login-password"
            fullWidth
            placeholder="Digite sua senha"
            {...register("password")}
            type={showPassword ? "text" : "password"}
            error={!!errors.password}
            helperText={errors.password?.message}
            sx={inputSx}
          />
        </div>
      </div>

      <div className="mt-3 mb-6 flex items-center justify-between">
        <label className="flex items-center cursor-pointer">
          <Checkbox
            className="text-zinc-700"
            onChange={() => SetShowPassoword(!showPassword)}
          />
          <span className="text-zinc-700 text-nowrap">Exibir senha</span>
        </label>

        <Link
          href="/login/forget-password"
          className="font-medium text-[#16B97D] hover:underline"
        >
          Esqueceu a senha?
        </Link>
      </div>

      <Button
        type="submit"
        disabled={loading}
        fullWidth
        sx={{
          height: 48,
          borderRadius: "10px",
          fontWeight: 700,
          color: "#FFFFFF",
          backgroundColor: "#16B97D",
          "&:hover": { backgroundColor: "#12a06b" },
          "&.Mui-disabled": { color: "#FFFFFF", opacity: 0.7 },
        }}
      >
        {loading ? (
          <div className="flex items-center gap-2">
            <ArrowPathIcon className="h-4 w-4 animate-spin" />
            Carregando...
          </div>
        ) : (
          "ENTRAR"
        )}
      </Button>
    </form>
  );
}
