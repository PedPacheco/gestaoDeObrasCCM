import { ErrorThrower } from "@/components/common/ErrorThrower";
import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";

describe("ButtonComponent", () => {
  it("deve renderizar o texto corretamente", () => {
    expect(() => render(<ErrorThrower message="teste de erro" />)).toThrowError(
      "teste de erro"
    );
  });
});
