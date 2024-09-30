import { z } from "zod";

export const userLoginSchema = z.object({
  user: z.string().min(1, "O usuário tem que ser inserido"),
  password: z
    .string()
    .min(8, "A senha tem que contem 8 caracteres")
    .regex(/[A-Z]/, "Senha deve conter no mínimo 1 letra maiuscula")
    .regex(/[a-z]/, "Senha deve conter no mínimo 1 letra míniscula")
    .regex(/\d/, "Senha deve conter no mínimo 1 número")
    .regex(/[^A-Za-z0-9]/, "Senha deve conter no mínimo 1 caractere espercial"),
});
