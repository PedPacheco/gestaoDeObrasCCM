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
import { ButtonComponent } from "../common/Button";

type UserLoginSchema = z.infer<typeof userLoginSchema>;

export function FormLogin() {
  const [showPassword, setShowPassoword] = useState(false);
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
      const response = await login(user, password);

      if (response.success) {
        router.push("/");
      } else {
        showError(response.message);
      }
    } catch (error: any) {
      showError("Ocorreu um erro durante o login.");
    }
  }

  return (
    <form
      onSubmit={handleSubmit(handleUserLogin)}
      className="flex flex-col gap-6"
    >
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Usuário
        </label>
        <input
          type="text"
          placeholder="Seu usuário"
          {...register("user")}
          className={`w-full px-4 py-3.5 rounded-lg border text-base text-slate-800 outline-none transition-colors placeholder:text-slate-400
            ${errors.user ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"}`}
        />
        {errors.user && (
          <p className="text-xs text-red-500 mt-1">{errors.user.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">
          Senha
        </label>
        <input
          type={showPassword ? "text" : "password"}
          placeholder="••••••••"
          {...register("password")}
          className={`w-full px-4 py-3.5 rounded-lg border text-base text-slate-800 outline-none transition-colors placeholder:text-slate-400
            ${errors.password ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"}`}
        />
        {errors.password && (
          <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
        )}
      </div>

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showPassword}
            onChange={() => setShowPassoword(!showPassword)}
            className="w-4 h-4 rounded border-slate-300 text-emerald-500 focus:ring-emerald-500 cursor-pointer"
          />
          <span className="text-sm text-slate-600">Exibir senha</span>
        </label>

        <Link
          href="/login/forget-password"
          className="text-sm font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
        >
          Esqueceu a senha?
        </Link>
      </div>

      <ButtonComponent text="ENTRAR" type="submit" />
    </form>
  );
}
