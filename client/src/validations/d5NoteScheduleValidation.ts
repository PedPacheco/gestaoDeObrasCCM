// validations/d5ScheduleValidation.ts
import { z } from "zod";

export const D5ScheduleSchema = z
  .object({
    d5NoteId: z.number(),
    scheduledDate: z.string().min(1, "Data de programação é obrigatória"),

    prog: z.preprocess(
      (val) => (val === "" ? undefined : Number(val)),
      z
        .number({ error: "Progresso deve ser um número" })
        .min(0, "Mínimo 0")
        .max(100, "Máximo 100"),
    ),

    exec: z.coerce.number().min(0).max(100).optional().nullable(),

    startTime: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),

    numDp: z
      .string()
      .max(25, "Número do DP deve ter no máximo 25 caracteres")
      .optional()
      .nullable(),
    serviceType: z
      .string()
      .max(30, "Tipo de serviço deve ter no máximo 30 caracteres")
      .optional()
      .nullable(),
    chi: z.coerce.number().optional().nullable(),

    lmTeam: z.coerce.number().optional().nullable(),
    lvTeam: z.coerce.number().optional().nullable(),
    regulTeam: z.coerce.number().optional().nullable(),
    temporaryKey: z.boolean().optional(),

    technicalId: z.coerce.number().optional().nullable(),
    restrictionId: z.coerce.number().optional().nullable(),
    restrictionResponsible: z
      .string()
      .max(50, "Responsável deve ter no máximo 50 caracteres")
      .optional()
      .nullable(),

    observation: z.string().optional().nullable(),
    executionObservation: z.string().optional().nullable(),
  })
  // Espelha a regra da entidade: ou ambas as horas, ou nenhuma
  .refine((d) => !!d.startTime === !!d.endTime, {
    message: "Informe hora de início e hora de término em conjunto",
    path: ["endTime"],
  })
  .refine((d) => !d.startTime || !d.endTime || d.startTime < d.endTime, {
    message: "Horário de fim deve ser posterior ao início",
    path: ["endTime"],
  });

export type D5ScheduleFormData = z.infer<typeof D5ScheduleSchema>;
