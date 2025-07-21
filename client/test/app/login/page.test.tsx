import { describe, expect, it, vi } from "vitest";

import Login from "@/app/login/page";
import { render, screen } from "@testing-library/react";
import { UserProviderWrapper } from "@/components/login/UserProviderWrapper";

vi.mock("@/components/login/FormLogin", () => ({
  FormLogin: vi.fn(() => (
    <div data-testid="mock-form-login">Formulário de login</div>
  )),
}));

vi.mock("@/components/login/UserProviderWrapper", () => ({
  UserProviderWrapper: vi.fn(({ children }) => (
    <div data-testid="mock-user-provider-wrapper">{children}</div>
  )),
}));

describe("Home page component", () => {
  it("Deve renderizar a página com o componente Header e com imagem no plano de fundo", () => {
    render(<Login />);

    expect(
      screen.getByTestId("mock-user-provider-wrapper")
    ).toBeInTheDocument();
    expect(screen.getByTestId("mock-form-login")).toBeInTheDocument();

    expect(UserProviderWrapper).toHaveBeenCalled();
  });
});
