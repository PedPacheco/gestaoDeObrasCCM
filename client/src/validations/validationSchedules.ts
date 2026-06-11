import { z } from "zod";

export const schedulesSchema = () =>
  z.object({
    idWork: z.number(),
    dataProg: z.string().min(1, "Data obrigatória"),
    startTime: z.string().min(1, "Horário de início obrigatório"),
    finishTime: z.string().min(1, "Horário de fim obrigatório"),
    prog: z
      .preprocess(
        (val) => (val === "" ? undefined : Number(val)),
        z
          .number({ error: "Progresso deve ser um número" })
          .min(0, "Mínimo 0%")
          .max(100, "Máximo 100%"),
      )
      .optional(),
    serviceType: z.string().optional(),
    observation: z.string().optional(),
    equipment: z.string().optional(),
    chi: z.preprocess(
      (val) => Number(val),
      z.number({ error: "CHI deve ser um número" }).min(0),
    ),
    numDp: z.string().optional(),
    temporaryKey: z.boolean().optional(),
    idTechnical: z.preprocess(
      (val) => Number(val),
      z.number({ error: "Técnico deve ser um número" }),
    ),
    idProgRestriction1: z.number(),
    responsibilityProg: z.string().nullable().optional(),
    responsibleName: z.string().nullable().optional(),
    responsibleArea: z.string().nullable().optional(),
    restrictionStatus: z.string().nullable().optional(),
    resolutionDate: z.string().nullable().optional(),
    idProgRestriction2: z.number(),
    responsibilityProg2: z.string().nullable().optional(),
    responsibleName2: z.string().nullable().optional(),
    responsibleArea2: z.string().nullable().optional(),
    restrictionStatus2: z.string().nullable().optional(),
    resolutionDate2: z.string().nullable().optional(),
    validated: z.boolean().optional(),
    confirmed: z.boolean().optional(),
  });
