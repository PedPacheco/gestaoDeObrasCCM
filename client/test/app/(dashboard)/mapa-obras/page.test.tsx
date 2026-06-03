// test/app/mapa-obras/page.test.tsx

import MapaObrasPage, {
  dynamic,
  revalidate,
} from "@/app/(dashboard)/mapa-obras/page";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HOISTED MOCKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

const { mockCookiesGet } = vi.hoisted(() => ({
  mockCookiesGet: vi.fn(),
}));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// MOCKS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: mockCookiesGet,
  })),
}));

vi.mock("@/components/common/ErrorThrower", () => ({
  ErrorThrower: ({ message }: { message: string }) => (
    <div data-testid="error-thrower" data-message={message}>
      {message}
    </div>
  ),
}));

vi.mock("@/components/worksMap/worksMapWrapper", () => ({
  default: ({ token }: { token: string }) => (
    <div data-testid="works-map-wrapper" data-token={token}>
      WorksMapWrapper
    </div>
  ),
}));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// IMPORT DO SERVER COMPONENT
// Deve vir depois dos mocks
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Ajuste este caminho conforme o seu projeto

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// HELPERS
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function mockTokenCookie(value?: string) {
  mockCookiesGet.mockImplementation((name: string) => {
    if (name !== "token") return undefined;

    if (value === undefined) return undefined;

    return { value };
  });
}

async function renderPage() {
  const jsx = await MapaObrasPage();
  return render(jsx);
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// TESTES
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

describe("MapaObrasPage", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("exports do módulo", () => {
    it("deve exportar dynamic como force-dynamic", () => {
      expect(dynamic).toBe("force-dynamic");
    });

    it("deve exportar revalidate como 0", () => {
      expect(revalidate).toBe(0);
    });
  });

  describe("quando existe token", () => {
    it("deve renderizar WorksMapWrapper com o token do cookie", async () => {
      mockTokenCookie("token-123");

      await renderPage();

      const wrapper = screen.getByTestId("works-map-wrapper");

      expect(wrapper).toBeInTheDocument();
      expect(wrapper).toHaveAttribute("data-token", "token-123");
      expect(wrapper).toHaveTextContent("WorksMapWrapper");

      expect(screen.queryByTestId("error-thrower")).not.toBeInTheDocument();
    });

    it("deve chamar cookies e procurar pelo cookie token", async () => {
      mockTokenCookie("token-abc");

      await renderPage();

      expect(mockCookiesGet).toHaveBeenCalledTimes(1);
      expect(mockCookiesGet).toHaveBeenCalledWith("token");
    });

    it("deve renderizar o container com as classes e altura corretas", async () => {
      mockTokenCookie("token-layout");

      const { container } = await renderPage();

      const rootDiv = container.firstElementChild as HTMLElement;

      expect(rootDiv).toBeInTheDocument();

      expect(rootDiv).toHaveClass(
        "w-full",
        "flex-1",
        "overflow-hidden",
        "flex",
        "flex-col",
      );

      expect(rootDiv).toHaveStyle({
        height: "calc(100vh - 120px)",
      });
    });

    it("não deve renderizar ErrorThrower quando token existe", async () => {
      mockTokenCookie("valid-token");

      await renderPage();

      expect(screen.queryByTestId("error-thrower")).not.toBeInTheDocument();
      expect(screen.getByTestId("works-map-wrapper")).toBeInTheDocument();
    });
  });

  describe("quando não existe token", () => {
    it("deve renderizar ErrorThrower quando cookie token não existe", async () => {
      mockTokenCookie(undefined);

      await renderPage();

      const error = screen.getByTestId("error-thrower");

      expect(error).toBeInTheDocument();
      expect(error).toHaveTextContent("Token não encontrado");
      expect(error).toHaveAttribute("data-message", "Token não encontrado");

      expect(screen.queryByTestId("works-map-wrapper")).not.toBeInTheDocument();
    });

    it("deve renderizar ErrorThrower quando token é string vazia", async () => {
      mockTokenCookie("");

      await renderPage();

      expect(screen.getByTestId("error-thrower")).toHaveTextContent(
        "Token não encontrado",
      );

      expect(screen.queryByTestId("works-map-wrapper")).not.toBeInTheDocument();
    });

    it("deve renderizar ErrorThrower quando cookie token retorna value undefined", async () => {
      mockCookiesGet.mockImplementation((name: string) => {
        if (name === "token") {
          return { value: undefined };
        }

        return undefined;
      });

      await renderPage();

      expect(screen.getByTestId("error-thrower")).toHaveTextContent(
        "Token não encontrado",
      );

      expect(screen.queryByTestId("works-map-wrapper")).not.toBeInTheDocument();
    });

    it("não deve renderizar o container do mapa quando token está ausente", async () => {
      mockTokenCookie(undefined);

      const { container } = await renderPage();

      expect(screen.getByTestId("error-thrower")).toBeInTheDocument();
      expect(screen.queryByTestId("works-map-wrapper")).not.toBeInTheDocument();

      const rootDiv = container.firstElementChild as HTMLElement;

      expect(rootDiv).not.toHaveClass("w-full");
      expect(rootDiv).not.toHaveStyle({
        height: "calc(100vh - 120px)",
      });
    });
  });
});
