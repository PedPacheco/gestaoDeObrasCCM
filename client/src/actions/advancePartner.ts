// app/.../advance-partner/actions.ts
"use server";

import type { CreateAdvancePartnerPayload } from "@/components/dashboard/advancePartner/indicators/types";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

type ActionResult = { ok: true } | { ok: false; error: string };

function getErrorMessage(body: unknown): string | undefined {
  if (!body || typeof body !== "object" || !("message" in body)) return;

  const message = (body as { message?: unknown }).message;
  if (typeof message === "string") return message;
  if (Array.isArray(message)) return message.join("\n");

  return undefined;
}

export async function createAdvancePartnerIndicatorsAction(
  payload: CreateAdvancePartnerPayload,
): Promise<ActionResult> {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value; // use o nome real do cookie

  if (!token) {
    return {
      ok: false,
      error: "Sessão não encontrada. Inicie sessão novamente.",
    };
  }

  const baseUrl = process.env.NEXT_PUBLIC_API_URL;
  if (!baseUrl) {
    console.error("A variável de ambiente API_URL não está configurada.");
    return { ok: false, error: "Não foi possível enviar os indicadores." };
  }

  try {
    const response = await fetch(`${baseUrl}/avanca-parceira`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
      cache: "no-store",
    });

    if (!response.ok) {
      const body = await response.json().catch(() => null);

      // Mostra mensagens de validação/regra de negócio (4xx),
      // mas não expõe detalhes técnicos de erros do servidor (5xx).
      if (response.status >= 400 && response.status < 500) {
        return {
          ok: false,
          error:
            getErrorMessage(body) ?? "Não foi possível lançar os indicadores.",
        };
      }

      console.error(
        "Falha da API ao criar indicadores:",
        response.status,
        body,
      );
      return {
        ok: false,
        error: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
      };
    }

    revalidatePath("/"); // substitua pelo caminho real da página
    return { ok: true };
  } catch (error) {
    console.error("Falha de comunicação com a API:", error);
    return {
      ok: false,
      error: "Não foi possível comunicar com o servidor. Tente novamente.",
    };
  }
}
