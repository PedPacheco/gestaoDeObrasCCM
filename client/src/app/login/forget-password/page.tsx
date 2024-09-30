"use client";

import { ButtonComponent } from "@/components/common/Button";
import { ArrowLeftIcon } from "@heroicons/react/20/solid";
import { TextField } from "@mui/material";
import Link from "next/link";
import { FormEvent, useState } from "react";

export default function ForgetPassword() {
  const [username, SetUsername] = useState("");

  async function handleSendEmail(event: FormEvent) {
    event.preventDefault();

    if (!username) {
      return;
    }

    try {
      const response = await fetch(
        "http://localhost:3333/auth/reset-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Error:", errorData);
      } else {
        console.log("Success!");
      }
    } catch (error) {
      console.error("Network Error:", error);
    }
  }

  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="w-[90%] sm:w-96 h-[540px] flex justify-center border border-solid border-zinc-700 shadow-2xl">
        <div className="flex flex-col items-center">
          <div className="flex flex-col items-center mt-8">
            <Link href="/login" className="self-start ml-4">
              <ArrowLeftIcon className="block h-8 w-8 hover:text-[#53FF75] transition-colors" />
            </Link>

            <h1 className="text-3xl font-bold mt-4 text-zinc-700">
              Redefinição de senha
            </h1>
            <p className="text-center mt-6">
              Informe seu usuário e enviaremos um link para recuperação da sua
              senha
            </p>
          </div>

          <form
            className="w-full flex flex-col items-center mt-32"
            onSubmit={handleSendEmail}
          >
            <div className="flex flex-col items-center mb-16 w-[90%] sm:w-80">
              <div className="h-40 w-full">
                <TextField
                  className="w-full mb-2"
                  label="Digite seu usuário"
                  value={username}
                  onChange={(e) => SetUsername(e.target.value)}
                />

                <ButtonComponent
                  text="Enviar link de recuperação"
                  styled="mt-8 w-full"
                  type="submit"
                />
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
