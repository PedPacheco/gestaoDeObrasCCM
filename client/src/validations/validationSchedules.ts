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

    if (eq.patrimony.length < 7) {
      ctx.issues.push({
        code: "custom",
        path: ["appliedEquipment", i, "patrimony"],
        message: "Número mínimo de caracteres é 7",
      });
    }

    if (!eq.installation?.trim()) {
      ctx.issues.push({
        code: "custom",
        path: ["appliedEquipment", i, "installation"],
        message: "Instalação obrigatória",
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

    if (!eq.installation?.trim()) {
      ctx.issues.push({
        code: "custom",
        path: ["equipmentRemoved", i, "installation"],
        message: "Instalação obrigatória",
      });
    }
  }
}

export const schedulesSchema = (isInsert?: boolean) =>
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
      executionObservation: z.string().optional(),
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
    })
    .check((ctx) => {
      const {
        exec,
        prog,
        idExecutionRestriction,
        responsibility,
        executionObservation,
      } = ctx.value;

      console.log(executionObservation);

      if (!isInsert) {
        if (Number(exec) < prog && exec !== "null" && exec !== "") {
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

          if (executionObservation === "" || !executionObservation) {
            ctx.issues.push({
              path: ["executionObservation"],
              code: "custom",
              message: "Observação é obrigatório",
              input: ctx.value,
            });
          }
        }
      }
    });

export const equipmentItemSchema = z.object({
  equipment: z.string(),
  power: z.preprocess((val) => String(val), z.string()),
  patrimony: z.string(),
  installation: z.string(),
  type: z.enum(["DEFAULT", "CS"]).default("DEFAULT"),
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
    startContact: z.string().optional(),
    endContact: z.string().optional(),
    delayJustification: z.string().optional(),
    hasEquipmentInstalled: z.boolean(),
    appliedEquipment: z.array(equipmentItemSchema),
    hasEquipmentRemoved: z.boolean(),
    equipmentRemoved: z.array(equipmentItemSchema),
    changesExecution: z.boolean(),
    generalObservation: z.string().optional(),
    reason: z.string().optional(),
    provisionalKeyInstalled: z.boolean(),
    provisionalKeyReference: z.string().optional(),
    provisionalKeyWithdrawn: z.boolean().nullable().optional(),
    provisionalKeyReferenceWithdrawn: z.string().optional(),
  })
  .check((ctx) => {
    checkRemovedEquipment(ctx);
    checkAppliedEquipment(ctx);
  });

export const validationSchedulesSchema = (
  initialExecValue: string | null | undefined,
  isInsert: boolean,
) =>
  schedulesSchema(isInsert)
    .safeExtend({
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
        executionReport?.provisionalKeyInstalled &&
        (executionReport.provisionalKeyWithdrawn === undefined ||
          executionReport.provisionalKeyWithdrawn === null)
      ) {
        ctx.issues.push({
          path: ["executionReport", "provisionalKeyWithdrawn"],
          code: "custom",
          message: "A condição da chave provisória deve ser informada",
          input: ctx.value,
        });
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

      if (ctx.value.serviceType?.includes("DP") && executionReport) {
        if (
          !executionReport.startContact ||
          executionReport.startContact.trim() === ""
        ) {
          ctx.issues.push({
            path: ["executionReport", "startContact"],
            code: "custom",
            message: "Contato de início obrigatório para serviços DP",
            input: ctx.value,
          });
        }

        if (
          !executionReport.endContact ||
          executionReport.endContact.trim() === ""
        ) {
          ctx.issues.push({
            path: ["executionReport", "endContact"],
            code: "custom",
            message: "Contato de término obrigatório para serviços DP",
            input: ctx.value,
          });
        }
      }
    });
