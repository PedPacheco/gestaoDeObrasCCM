import { z } from "zod";

export const schedulesSchemaV2 = (isInsert?: boolean) =>
  z
    .object({
      id: z.number(),
      dataProg: z.string().min(1, "Data obrigatória"),
      startTime: z.string().min(1, "Horário de início obrigatório"),
      finishTime: z.string().min(1, "Horário de fim obrigatório"),
      prog: z.preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z
          .number({ error: "Progresso deve ser um número" })
          .min(0, "Mínimo 0%")
          .max(100, "Máximo 100%"),
      ),
      exec: z.string().max(100).optional().nullable(),
      serviceType: z.string().optional(),
      observation: z.string().optional(),
      equipment: z.string().optional(),
      chi: z.preprocess(
        (val) => Number(val),
        z.number({ error: "CHI deve ser um número" }).min(0),
      ),
      numDp: z.string().optional(),
      temporaryKey: z.boolean().optional(),
      lmTeam: z.preprocess(
        (val) => Number(val),
        z.number({ error: "Equipe LM deve ser um número" }).min(0),
      ),
      regulTeam: z.preprocess(
        (val) => Number(val),
        z.number({ error: "Equipe Reguladora deve ser um número" }).min(0),
      ),
      lvTeam: z.preprocess(
        (val) => Number(val),
        z.number({ error: "Equipe LV deve ser um número" }).min(0),
      ),
      idTechnical: z.preprocess(
        (val) => Number(val),
        z.number({ error: "Técnico deve ser um número" }),
      ),
      idExecutionRestriction: z.preprocess(
        (val) => Number(val),
        z.number({ error: "Restrição deve ser um número" }),
      ),
      responsibility: z.string().optional(),
      idProgRestriction1: z.number(),
      responsiblityProg: z.string().nullable().optional(),
      responsibleName: z.string().nullable().optional(),
      responsibleArea: z.string().nullable().optional(),
      restrictionStatus: z.string().nullable().optional(),
      resolutionDate: z.string().nullable().optional(),
      idProgRestriction2: z.number(),
      responsiblityProg2: z.string().nullable().optional(),
      responsibleName2: z.string().nullable().optional(),
      responsibleArea2: z.string().nullable().optional(),
      restrictionStatus2: z.string().nullable().optional(),
      resolutionDate2: z.string().nullable().optional(),
      validated: z.boolean().optional(),
      confirmed: z.boolean().optional(),
      idUser: z.number().nullable().optional(),
    })
    .check((ctx) => {
      const { exec, prog, idExecutionRestriction, responsibility } = ctx.value;

      if (!isInsert) {
        if (Number(exec) !== prog && exec !== "null" && exec !== "") {
          if (idExecutionRestriction === 1) {
            ctx.issues.push({
              path: ["idExecutionRestriction"],
              code: "custom",
              message: "Restrição é obrigatória",
              input: ctx.value,
            });
          }

          if (responsibility === "") {
            ctx.issues.push({
              path: ["responsibility"],
              code: "custom",
              message: "Responsável é obrigatório",
              input: ctx.value,
            });
          }
        }
      }
    });
