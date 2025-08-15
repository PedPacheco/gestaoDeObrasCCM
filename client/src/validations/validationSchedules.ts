import { z } from "zod";

function checkAppliedEquipment(ctx: any) {
  if (
    ctx.value.hasEquipmentInstalled &&
    ctx.value.appliedEquipment.length === 0
  ) {
    ctx.issues.push({
      code: "custom",
      path: ["appliedEquipment"],
      message: "Informe pelo menos um equipamento aplicado",
      input: ctx.value,
    });
  }

  for (let i = 0; i < ctx.value.appliedEquipment.length; i++) {
    const eq = ctx.value.appliedEquipment[i];

    if (!eq.equipment?.trim()) {
      ctx.issues.push({
        code: "custom",
        path: ["appliedEquipment", i, "equipment"],
        message: "Equipamento obrigatório",
      });
    }

    if (!eq.power?.trim()) {
      ctx.issues.push({
        code: "custom",
        path: ["appliedEquipment", i, "power"],
        message: "Potência obrigatória",
      });
    }

    if (!eq.patrimony?.trim()) {
      ctx.issues.push({
        code: "custom",
        path: ["appliedEquipment", i, "patrimony"],
        message: "Patrimônio obrigatório",
      });
    }
  }
}

function checkRemovedEquipment(ctx: any) {
  if (
    ctx.value.hasEquipmentRemoved &&
    ctx.value.equipmentRemoved.length === 0
  ) {
    ctx.issues.push({
      code: "custom",
      path: ["equipmentRemoved"],
      message: "Informe pelo menos um equipamento removido",
      input: ctx.value,
    });
  }

  for (let i = 0; i < ctx.value.equipmentRemoved.length; i++) {
    const eq = ctx.value.equipmentRemoved[i];

    if (!eq.equipment?.trim()) {
      ctx.issues.push({
        code: "custom",
        path: ["equipmentRemoved", i, "equipment"],
        message: "Equipamento obrigatório",
      });
    }
    if (!eq.power?.trim()) {
      ctx.issues.push({
        code: "custom",
        path: ["equipmentRemoved", i, "power"],
        message: "Potência obrigatória",
      });
    }
    if (!eq.patrimony?.trim()) {
      ctx.issues.push({
        code: "custom",
        path: ["equipmentRemoved", i, "patrimony"],
        message: "Patrimônio obrigatório",
      });
    }
  }
}

export const schedulesSchema = z.object({
  id: z.number(),
  dataProg: z.string().min(1, "Data obrigatória"),
  startTime: z.string().min(1, "Horário de início obrigatório"),
  finishTime: z.string().min(1, "Horário de fim obrigatório"),

  prog: z.preprocess(
    (val) => (val === "" ? undefined : Number(val)),
    z
      .number({ error: "Progresso deve ser um número" })
      .min(0, "Mínimo 0%")
      .max(100, "Máximo 100%")
  ),

  exec: z.string().max(100).optional().nullable(),

  serviceType: z.string().optional(),
  equipment: z.string().optional(),

  chi: z.preprocess(
    (val) => Number(val),
    z.number({ error: "CHI deve ser um número" }).min(0)
  ),

  numDp: z.string().optional(),
  temporaryKey: z.boolean().optional(),

  lmTeam: z.preprocess(
    (val) => Number(val),
    z.number({ error: "Equipe LM deve ser um número" }).min(0)
  ),
  regulTeam: z.preprocess(
    (val) => Number(val),
    z.number({ error: "Equipe Reguladora deve ser um número" }).min(0)
  ),
  lvTeam: z.preprocess(
    (val) => Number(val),
    z.number({ error: "Equipe LV deve ser um número" }).min(0)
  ),

  idTechnical: z.preprocess(
    (val) => Number(val),
    z.number({ error: "Técnico deve ser um número" })
  ),
  idExecutionRestriction: z.preprocess(
    (val) => Number(val),
    z.number({ error: "Restrição deve ser um número" })
  ),

  responsibility: z.string().optional(),
});

export const equipmentItemSchema = z.object({
  equipment: z.string(),
  power: z.preprocess((val) => String(val), z.string()),
  patrimony: z.string(),
});

export const executionReportSchema = z
  .object({
    id: z.number(),
    idUser: z.number(),
    supervisor: z.string().min(1, "Supervisor obrigatório"),
    partialConnectionReleased: z.boolean(),
    startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:mm"),
    finishTime: z
      .string()
      .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Formato HH:mm"),
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
  })
  .check((ctx) => {
    checkRemovedEquipment(ctx);
    checkAppliedEquipment(ctx);
  });

export const validationSchedulesSchema = (
  initialExecValue: string | null | undefined
) =>
  schedulesSchema
    .extend({
      executionReport: z.union([executionReportSchema, z.null()]).optional(),
    })
    .check((ctx) => {
      const { exec, executionReport, finishTime } = ctx.value;

      const execAlterado = exec !== initialExecValue;

      if (
        execAlterado &&
        executionReport &&
        (initialExecValue !== "null" || initialExecValue !== null)
      ) {
        const result = executionReportSchema.safeParse(executionReport);

        if (!result.success) {
          result.error.issues.forEach((error) => {
            ctx.issues.push({
              path: ["executionReport", ...error.path],
              code: "custom",
              message: error.message,
              input: ctx.value,
            });
          });
        }
      }

      if (
        executionReport &&
        finishTime < executionReport.finishTime &&
        (!executionReport.delayJustification ||
          executionReport.delayJustification.trim() === "")
      ) {
        ctx.issues.push({
          path: ["executionReport", "delayJustification"],
          code: "custom",
          message: "Justificativa de atraso obrigatória",
          input: ctx.value,
        });
      }
    });
