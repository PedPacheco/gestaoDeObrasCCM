import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { mockFormData } from "../../../../mocks/mockFormData";
import { TeamsPanel } from "@/components/details/modals/scheduleDialog/teamsPanel";

describe("TeamsPanel component", () => {
  it("deve renderizar os campos corretamente", () => {
    const onInputChange = vi.fn();

    render(
      <TeamsPanel
        formData={mockFormData}
        formErrors={{}}
        onInputChange={onInputChange}
        disabledFields={() => false}
      />
    );

    expect(screen.getByLabelText(/Equipe LM/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Equipe Regular/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Equipe LV/i)).toBeInTheDocument();
  });
});
