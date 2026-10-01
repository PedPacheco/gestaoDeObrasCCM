import Image from "next/image";

import { FormLogin } from "@/components/login/FormLogin";

export default function Login() {
  return (
    <div className="flex min-h-screen w-full flex-col lg:flex-row">
      <div className="relative hidden lg:flex lg:w-1/2 items-center justify-center bg-[#212E3E]">
        <Image
          src="/fundo.png"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-[#212E3E]/75" />

        <div className="relative z-10 flex w-full max-w-md items-center justify-center px-8">
          <Image
            src="/logo-sigo.png"
            alt="Logo SIGO"
            width={520}
            height={360}
            className="h-auto w-full object-contain"
            priority
          />
        </div>

        <div className="absolute bottom-8 left-0 right-0 z-10 flex items-center justify-center gap-4">
          <Image
            src="/edpLogo.png"
            alt="EDP"
            width={80}
            height={60}
            className="h-auto w-20 object-contain"
          />
          <div className="h-8 w-px bg-zinc-400" />
          <span className="text-zinc-300">São Paulo</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-white lg:w-1/2">
        <div className="flex justify-center bg-[#212E3E] px-6 py-8 lg:hidden">
          <Image
            src="/logo-sigo.png"
            alt="Logo SIGO"
            width={160}
            height={110}
            className="h-auto w-32 object-contain"
            priority
          />
        </div>

        <div className="flex flex-1 items-center justify-center px-6 py-10">
          <div className="w-full max-w-[480px]">
            <h1 className="text-4xl font-bold text-[#212E3E]">Entrar</h1>
            <p className="mt-2 mb-8 text-zinc-500">
              Use suas credenciais corporativas para acessar o sistema.
            </p>
            <FormLogin />
          </div>
        </div>
      </div>
    </div>
  );
}
