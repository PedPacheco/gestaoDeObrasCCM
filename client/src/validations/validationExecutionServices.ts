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

export const schedulesSchemaV2 = (isPartial?: boolean) =>
  z
    .object({
      idWork: z.number(),
      idSchedule: z.number().nullable(),
      idExecutionRestriction: z.preprocess(
        (val) => Number(val),
        z.number({ error: "Restrição deve ser um número" }),
      ),
      responsibility: z.string().optional(),
      executionObservation: z.string().optional(),
    })
    .check((ctx) => {
      const { executionObservation, idExecutionRestriction, responsibility } =
        ctx.value;

      if (isPartial) {
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
    });

export const equipmentItemSchemaV2 = z.object({
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
    appliedEquipment: z.array(equipmentItemSchemaV2),
    hasEquipmentRemoved: z.boolean(),
    equipmentRemoved: z.array(equipmentItemSchemaV2),
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

export const validationExecutionService = (isPartial?: boolean) =>
  schedulesSchemaV2(isPartial)
    .safeExtend({
      executionReport: z.union([executionReportSchema, z.null()]).optional(),
      serviceType: z.string().optional(),
      finishTime: z.string().min(1, "Horário de fim obrigatório"),
    })
    .check((ctx) => {
      const { executionReport, finishTime } = ctx.value;

      const result = executionReportSchema.safeParse(executionReport);

      if (result.data?.finishTime === "00:00") {
        ctx.issues.push({
          path: ["executionReport", "finishTime"],
          code: "custom",
          message: "Informar horário do término",
          input: ctx.value,
        });
      }

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
