import { z } from "zod";

export const schedulesSchema = z.object({
  id: z.number(),
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

  exec: z.string().max(100).optional().nullable(),

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

  responsibility: z.string().optional(),
});

export const equipmentItemSchema = z.object({
  equipment: z.string(),
  power: z.string(),
  patrimony: z.string(),
});

export const executionReportSchema = z.object({
  id: z.number(),
  idUser: z.number(),
  supervisor: z.string().min(1, "Supervisor obrigatório"),
  partialConnectionReleased: z.boolean(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:mm"),
  finishTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:mm"),
  startContact: z.string().min(1, "Contato de início obrigatório"),
  endContact: z.string().min(1, "Contato de término obrigatório"),
  delayJustification: z.string().optional(),
  hasEquipmentInstalled: z.boolean(),
  appliedEquipment: z.array(equipmentItemSchema),
  hasEquipmentRemoved: z.boolean(),
  equipmentRemoved: z.array(equipmentItemSchema),
  changesExecution: z.boolean(),
  generalObservation: z.string().optional(),
  workSituation: z.string().min(1, "Situação da obra obrigatório"),
  reason: z.string().optional(),
  provisionalKeyInstalled: z.boolean(),
  provisionalKeyReference: z.string().optional(),
  provisionalKeyWithdrawn: z.boolean(),
});

export const validationSchedulesSchema = (
  initialExecValue: string | null | undefined
) =>
  schedulesSchema
    .extend({
      executionReport: z.union([
        executionReportSchema,
        z.null(),
        z.undefined(),
      ]),
    })
    .superRefine((data, ctx) => {
      const execAlterado = data.exec !== initialExecValue;

      if (execAlterado && data.executionReport && initialExecValue !== "null") {
        const result = executionReportSchema.safeParse(data.executionReport);
        if (!result.success) {
          result.error.errors.forEach((error) => {
            ctx.addIssue({
              path: [...error.path],
              code: z.ZodIssueCode.custom,
              message: error.message,
            });
          });
        }
      }
    });
