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

import ErrorModal from "../common/ErrorModal";

type UserLoginSchema = z.infer<typeof userLoginSchema>;

export function FormLogin() {
  const [showPassword, setShowPassword] = useState(false);
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
    } catch {
      setError("Ocorreu um erro durante o login.");
      setIsModalOpen(true);
    }
  }

  return (
    <form onSubmit={handleSubmit(handleUserLogin)} className="flex flex-col gap-6">
      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">Usuário</label>
        <input
          type="text"
          placeholder="seu.usuario"
          {...register("user")}
          className={`w-full px-4 py-3.5 rounded-lg border text-base text-slate-800 outline-none transition-colors placeholder:text-slate-400
            ${errors.user ? "border-red-400 focus:border-red-500" : "border-slate-300 focus:border-emerald-500"}`}
        />
        {errors.user && (
          <p className="text-xs text-red-500 mt-1">{errors.user.message}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-bold text-slate-700 mb-2">Senha</label>
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
            onChange={() => setShowPassword(!showPassword)}
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

      <button
        type="submit"
        className="w-full py-3.5 rounded-full bg-emerald-500 text-white font-bold text-sm uppercase tracking-wider hover:bg-emerald-600 transition-colors mt-2"
      >
        ENTRAR
      </button>

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
