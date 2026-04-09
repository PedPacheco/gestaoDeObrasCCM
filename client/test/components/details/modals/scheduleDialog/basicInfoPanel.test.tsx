import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";
import { mockFormData } from "../../../../mocks/mockFormData";
import { render, screen } from "@testing-library/react";
import { BasicInfoPanel } from "@/components/details/modals/scheduleDialog/basicInfoPanel";

vi.mock("@/contexts/userContext", () => ({
  useUser: () => ({
    permissions: {
      permissao: "Total", // Permite exibir os botões
      permissao_visualizacao: "total", // Caso seu código cheque isso
      permissao_publicacao: true, // Incluído por segurança
    },
  }),
}));

describe("BasicInfoPanel Component", () => {
  beforeAll(() => {
    vi.useFakeTimers();
  });

  afterAll(() => {
    vi.useRealTimers();
  });

  beforeEach(() => {
    vi.setSystemTime(new Date("2025-01-10"));
  });

  it("Deve renderizar os campos corretamente", () => {
    const onInputChange = vi.fn();

    render(
      <BasicInfoPanel
        formData={mockFormData}
        isInsert={false}
        formErrors={{}}
        onInputChange={onInputChange}
        disabledFields={() => false}
      />,
    );

    expect(screen.getByLabelText(/Data da Programação/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Horário Início/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Horário Fim/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Progresso Programado:/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Progresso Executado:/i)).toBeInTheDocument();
  });

  it("Deve alterar valor do campo Exec", () => {
    const onInputChange = vi.fn();

    render(
      <BasicInfoPanel
        formData={{ ...mockFormData, exec: "null" }}
        isInsert={false}
        formErrors={{}}
        onInputChange={onInputChange}
        disabledFields={() => false}
      />,
    );

    expect(screen.getByLabelText(/Progresso Executado:/i)).toHaveValue("");
  });

  it("Deve alterar valor do campo Exec", () => {
    const onInputChange = vi.fn();

    render(
      <BasicInfoPanel
        formData={{ ...mockFormData, exec: undefined }}
        isInsert={false}
        formErrors={{}}
        onInputChange={onInputChange}
        disabledFields={() => false}
      />,
    );

    const gridElement =
      screen.getByLabelText(/progresso programado/i).parentElement
        ?.parentElement?.parentElement;

    expect(gridElement?.className).toMatch(/MuiGrid-grid-sm-12/);
  });

  it("deve desabilitar quando a data atual for antes da dataProg", () => {
    vi.setSystemTime(new Date("2025-01-10"));

    render(
      <BasicInfoPanel
        formData={{
          ...mockFormData,
          validated: true,
          confirmed: true,
          dataProg: "2025-01-15",
        }}
        isInsert={false}
        formErrors={{}}
        onInputChange={vi.fn()}
        disabledFields={() => false}
      />,
    );

    expect(screen.getByLabelText("Progresso Executado:")).toBeDisabled();
  });
});
