import React from "react";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import RejectionsOfSchedulesPanelItem from "@/components/details/panelItems/rejectionsOfSchedulesPanelItem";

// 🔹 Mocks
vi.mock("@/utils/formatValue", () => ({
  formatPercentage: vi.fn((v) => `${v}%`),
}));

vi.mock("@/utils/validDate", () => ({
  isValidDateString: vi.fn((value) => {
    return typeof value === "string" && value.includes("-");
  }),
}));

vi.mock("@mui/material", () => ({
  Table: ({ children }: any) => <table>{children}</table>,
  TableHead: ({ children }: any) => <thead>{children}</thead>,
  TableBody: ({ children }: any) => <tbody>{children}</tbody>,
  TableRow: ({ children }: any) => <tr>{children}</tr>,
  TableCell: ({ children }: any) => <td>{children}</td>,
  TableContainer: ({ children }: any) => <div>{children}</div>,
}));

describe("RejectionsOfSchedulesPanelItem", () => {
  it("should render all column headers", () => {
    render(<RejectionsOfSchedulesPanelItem data={[]} />);

    expect(screen.getByText("Data Programada")).toBeInTheDocument();
    expect(screen.getByText("Motivo da reprovação")).toBeInTheDocument();
    expect(screen.getByText("Horário de início")).toBeInTheDocument();
  });

  it("should render rows based on data", () => {
    const data = [
      {
        data_prog: "2024-01-01",
        motivo: "Teste",
        hora_ini: "2024-01-01T10:00:00Z",
        hora_ter: "2024-01-01T12:00:00Z",
        prog: 50,
        descricao: "desc",
      },
    ];

    render(<RejectionsOfSchedulesPanelItem data={data} />);

    expect(screen.getByText("Teste")).toBeInTheDocument();
    expect(screen.getByText("desc")).toBeInTheDocument();
  });

  it("should format percentage fields", () => {
    const data = [
      {
        prog: 75,
      },
    ];

    render(<RejectionsOfSchedulesPanelItem data={data} />);

    expect(screen.getByText("75%")).toBeInTheDocument();
  });

  it("should format valid date to DD/MM/YYYY", () => {
    const data = [
      {
        data_prog: "2024-01-15T00:00:00Z",
      },
    ];

    render(<RejectionsOfSchedulesPanelItem data={data} />);

    expect(screen.getByText("15/01/2024")).toBeInTheDocument();
  });

  it("should format 1970 dates as time (HH:mm)", () => {
    const data = [
      {
        hora_ini: "1970-01-01T10:30:00Z",
      },
    ];

    render(<RejectionsOfSchedulesPanelItem data={data} />);

    expect(screen.getByText("10:30")).toBeInTheDocument();
  });

  it("should render raw value when not date or percentage", () => {
    const data = [
      {
        descricao: "valor simples",
      },
    ];

    render(<RejectionsOfSchedulesPanelItem data={data} />);

    expect(screen.getByText("valor simples")).toBeInTheDocument();
  });

  it("should handle empty data gracefully", () => {
    render(<RejectionsOfSchedulesPanelItem data={[]} />);

    const rows = screen.queryAllByRole("row");
    expect(rows.length).toBeGreaterThan(0); // header still exists
  });

  it("should render multiple rows correctly", () => {
    const data = [{ motivo: "A" }, { motivo: "B" }];

    render(<RejectionsOfSchedulesPanelItem data={data} />);

    expect(screen.getByText("A")).toBeInTheDocument();
    expect(screen.getByText("B")).toBeInTheDocument();
  });
});
