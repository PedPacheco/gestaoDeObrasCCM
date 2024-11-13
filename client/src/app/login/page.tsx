import { FormLogin } from "@/components/login/FormLogin";
import Image from "next/image";

export default function Login() {
  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="w-[90%] sm:w-96 h-[420px] md:h-[480px] lg:h-[520px] flex justify-center border border-solid border-zinc-700 shadow-2xl">
        <div className="w-full h-full flex flex-col justify-between items-center">
          <div className="flex flex-col items-center mt-7">
            <h1 className="text-3xl font-bold py-4 text-zinc-700">Login</h1>
          </div>
          <FormLogin />
        </div>
      </div>
    </div>
  );
}
