import { z } from "zod";

export const createUserSchema = z
  .object({
    username: z.string().min(1, "O usuário é obrigatório").max(30),
    senha: z
      .string()
      .min(8, "A senha deve conter no mínimo 8 caracteres")
      .refine((val) => /[A-Z]/.test(val), "A senha deve conter letra maiúscula")
      .refine((val) => /[a-z]/.test(val), "A senha deve conter letra minúscula")
      .refine((val) => /\d/.test(val), "A senha deve conter número")
      .optional(),
    nome: z.string().min(1, "O nome é obrigatório").max(100),
    email: z.string().email("E-mail inválido").max(100),
    tipo_usuario: z.enum(["INTERNO", "PARCEIRA"]),
    is_admin: z.boolean(),
    permissao_edicao: z.boolean(),
    id_regional: z.number({ message: "A regional é obrigatória" }),
    id_turma: z.number({ message: "A turma é obrigatória" }),
    id_area: z.number().optional(),
  })
  .refine((data) => data.tipo_usuario !== "INTERNO" || !!data.id_area, {
    message: "A área é obrigatória para usuários internos",
    path: ["id_area"],
  });

export type CreateUserFormData = z.infer<typeof createUserSchema>;
