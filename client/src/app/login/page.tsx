import { FormLogin } from "@/components/login/FormLogin";
import Image from "next/image";

export default function Login() {
  return (
    <div className="flex min-h-screen w-full">
      {/* Lado esquerdo — fundo escuro com espiral EDP + logo SIGO */}
      <div className="hidden md:flex md:w-1/2 relative items-center justify-center overflow-hidden px-8 lg:px-12 py-10 bg-[#212e3e]">
        {/* Imagem de fundo */}
        <Image
          src="/fundo.png"
          alt=""
          fill
          className="object-cover object-center opacity-30"
        />

        {/* Logo SIGO central */}
        <Image
          src="/logo-sigo.png"
          alt="SIGO - Sistema Integrado Gestão de Obras"
          width={420}
          height={200}
          className="relative z-10 w-[320px] lg:w-[420px] h-auto object-contain"
        />

        {/* Logo EDP inferior */}
        <Image
          src="/edpLogo.png"
          alt="EDP"
          width={120}
          height={60}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 w-[120px] h-auto object-contain"
        />
      </div>

      {/* Lado direito — login */}
      <div className="flex flex-1 items-center justify-center bg-white px-6 py-8">
        <div className="w-full max-w-[420px] lg:max-w-[480px] xl:max-w-[520px] px-8 py-10">
          {/* Logo mobile */}
          <div className="md:hidden mb-8 text-center">
            <Image
              src="/logo-sigo.png"
              alt="SIGO"
              width={180}
              height={90}
              className="mx-auto w-[180px] h-auto object-contain"
            />
          </div>

          <h2 className="text-3xl lg:text-4xl font-black text-slate-800 mb-2">
            Entrar
          </h2>
          <p className="text-base text-slate-500 mb-10">
            Use suas credenciais corporativas para acessar o sistema.
          </p>

          <FormLogin />
        </div>
      </div>
    </div>
  );
}
