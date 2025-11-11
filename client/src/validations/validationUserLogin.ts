import { z } from "zod";

export const userRegistarSchema = z.object({
  user: z.string().min(1, "O usuário tem que ser inserido"),
  password: z
    .string()
    .min(8, "A senha tem que conter 8 caracteres")
    .refine(
      (val) => /[A-Z]/.test(val),
      "Senha deve conter no mínimo 1 letra maiúscula"
    )
    .refine(
      (val) => /[a-z]/.test(val),
      "Senha deve conter no mínimo 1 letra minúscula"
    )
    .refine((val) => /\d/.test(val), "Senha deve conter no mínimo 1 número")
    .refine(
      (val) => /[^A-Za-z0-9]/.test(val),
      "Senha deve conter no mínimo 1 caractere especial"
    ),
});

export const userLoginSchema = z.object({
  user: z.string().min(1, "O usuário precisa ser inserido"),
  password: z.string().min(1, "A senha precisa ser inserida"),
});
