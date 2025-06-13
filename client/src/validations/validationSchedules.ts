import { z } from "zod";

export const validationSchedulesSchema = z.object({
  dataProg: z.string().min(1, "Data obrigatória"),
  startTime: z.string().min(1, "Horário de início obrigatório"),
  finishTime: z.string().min(1, "Horário de fim obrigatório"),

  // Transforma o valor em número e valida
  prog: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z
      .number({ invalid_type_error: "Progresso deve ser um número" })
      .min(0, "Mínimo 0%")
      .max(100, "Máximo 100%")
  ),

  exec: z
    .preprocess(
      (val) => (val === "" ? undefined : Number(val)),
      z
        .number({ invalid_type_error: "Execução deve ser um número" })
        .min(0, "Mínimo 0%")
        .max(100, "Máximo 100%")
    )
    .optional(),

  serviceType: z.string().optional(),
  equipment: z.string().optional(),

  chi: z.preprocess(
    (val) => Number(val),
    z.number({ invalid_type_error: "CHI deve ser um número" }).min(0)
  ),

  numDp: z.string().optional(),
  temporaryKey: z.boolean().optional(),

  lmTeam: z.preprocess(
    (val) => Number(val),
    z.number({ invalid_type_error: "Equipe LM deve ser um número" }).min(0)
  ),
  regulTeam: z.preprocess(
    (val) => Number(val),
    z
      .number({ invalid_type_error: "Equipe Reguladora deve ser um número" })
      .min(0)
  ),
  lvTeam: z.preprocess(
    (val) => Number(val),
    z.number({ invalid_type_error: "Equipe LV deve ser um número" }).min(0)
  ),

  idTechnical: z.preprocess(
    (val) => Number(val),
    z.number({ invalid_type_error: "Técnico deve ser um número" })
  ),
  idExecutionRestriction: z.preprocess(
    (val) => Number(val),
    z.number({ invalid_type_error: "Restrição deve ser um número" })
  ),

  responsibilityExecution: z.string().optional(),
  observationExecution: z.string().optional(),
});
