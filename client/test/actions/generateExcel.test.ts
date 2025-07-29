import { exportExcel } from "@/actions/generateExcel.action";
import { describe, expect, it, vi } from "vitest";

describe("generateExcel", () => {
  it("Deve retornar os dados em formato de blob", async () => {
    const mockBlob = new Blob(["conteúdo de teste"], { type: "text/plain" });

    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      })
    ) as any;

    const result = await exportExcel("obras/obras-carteira", "fake-token");

    expect(result).toBeInstanceOf(Blob);
  });

  it("Deve lançar erro se a resposta não for ok", async () => {
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ message: "Deu ruim" }),
      })
    ) as any;

    await expect(
      exportExcel("obras/obras-carteira", "fake-token")
    ).rejects.toThrow("Deu ruim");
  });
});
