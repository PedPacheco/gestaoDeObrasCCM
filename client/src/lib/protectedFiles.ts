import "client-only"; // opcional: impede o uso no servidor (npm i client-only)
import { Cookies } from "react-cookie";

export type StorageKind = "viabilidade" | "as_build";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "";

/** Tipos que podem ser abertos no navegador. O resto é sempre baixado. */
const INLINE_TYPES = new Set(["application/pdf", "image/jpeg", "image/png"]);

/** Erro HTTP do download, com o status retornado pela API. */
export class FileRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "FileRequestError";
  }
}

// ───────────── token ─────────────
// Substitua pela função que o projeto já usa para obter o token.
function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return new Cookies().get("token", { doNotParse: true }) ?? null;
}

// ───────────── utilitários ─────────────

/**
 * Converte o valor de caminho_arquivo ("a.pdf;b.png") em lista de nomes.
 * Aceita também valores legados com caminho/URL ("/uploads/as_build/a.pdf").
 */
export function parseStoredFiles(value?: string | null): string[] {
  if (!value) return [];
  return value
    .split(";")
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => decodeURIComponent(v.split(/[\\/]/).pop() ?? v));
}

async function fetchProtectedFile(
  tipo: StorageKind,
  nome: string,
): Promise<Blob> {
  const token = getAccessToken();

  console.log(token);

  const res = await fetch(
    `${API_URL}/arquivos/${tipo}/${encodeURIComponent(nome)}`,
    {
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      signal: AbortSignal.timeout(60_000),
    },
  );

  console.log(res);

  if (!res.ok) {
    let message = res.statusText || `Erro ${res.status}`;
    if (res.headers.get("content-type")?.includes("application/json")) {
      const body = await res.json().catch(() => undefined);
      const m = body?.message;
      if (m) message = Array.isArray(m) ? m.join(", ") : m;
    }
    throw new FileRequestError(res.status, message);
  }

  return res.blob();
}

function downloadBlob(blob: Blob, nome: string) {
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), {
    href: url,
    download: nome,
  });
  a.click();
  URL.revokeObjectURL(url);
}

// ───────────── API pública ─────────────

/**
 * Abre PDF/imagem em nova aba; os demais tipos são baixados.
 * A aba é aberta antes do await para não ser bloqueada pelo navegador.
 */
export async function openProtectedFile(
  tipo: StorageKind,
  nome: string,
): Promise<void> {
  const win = window.open("", "_blank");
  try {
    const blob = await fetchProtectedFile(tipo, nome);

    if (!INLINE_TYPES.has(blob.type)) {
      win?.close();
      downloadBlob(blob, nome);
      return;
    }

    const url = URL.createObjectURL(blob);
    if (win) {
      win.opener = null; // mesmo efeito do rel="noopener"
      win.location.href = url;
    } else {
      window.location.href = url;
    }
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  } catch (err) {
    win?.close();
    throw err;
  }
}
