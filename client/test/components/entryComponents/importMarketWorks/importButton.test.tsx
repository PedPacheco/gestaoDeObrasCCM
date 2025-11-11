import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";

import ExcelJS from "exceljs";

import { InsertAuxiliaryBaseMarket } from "@/actions/insertAuxiliaryBase";
import { createBatches, groupNoteDate } from "@/utils/creationNoteBatches";
import { getButtonContent } from "@/utils/getButtonContent";
import { beforeEach, describe, expect, it, Mock, vi } from "vitest";
import { ImportButton } from "@/components/entryComponents/importMarketWorks/importButton";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("exceljs");
vi.mock("@/actions/insertAuxiliaryBase");
vi.mock("@/utils/creationNoteBatches");
vi.mock("@/utils/getButtonContent");

vi.mock("@/components/common/Button", () => ({
  ButtonComponent: ({ onClick, text, disabled }: any) => (
    <button onClick={onClick} disabled={disabled} data-testid="import-button">
      {text}
    </button>
  ),
}));

vi.mock("@/components/common/ErrorModal", () => ({
  default: ({ open, message, onClose, icon }: any) =>
    open ? (
      <div data-testid="error-modal">
        <p>{message}</p>
        <button onClick={onClose} data-testid="error-close">
          Fechar
        </button>
        {icon}
      </div>
    ) : null,
}));

vi.mock("@/components/common/Modal", () => ({
  default: ({ open, children, onClose, title }: any) =>
    open ? (
      <div data-testid="modal">
        <h2>{title}</h2>
        {children}
        <button onClick={onClose} data-testid="modal-close">
          Fechar
        </button>
      </div>
    ) : null,
}));

class MockFile {
  name: string;
  constructor(parts: any[], filename: string) {
    this.name = filename;
  }
  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(0));
  }
}

// @ts-ignore
global.File = MockFile;

describe("ImportButton - Testes Prioritários", () => {
  const mockWorkbook = {
    xlsx: { load: vi.fn() },
    worksheets: [{ getSheetValues: vi.fn() }],
  };

  const mockMarketData = [
    "",
    "obra1",
    "pep1",
    "diag1",
    "gpm1",
    "tipo1",
    "circ1",
    "prazo1",
    "",
    "statusOV1",
    "statusDiag1",
    "statusPep1",
    "equipe1",
    "moCliente1",
    "moEmpresa1",
    "entrada1",
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (ExcelJS.Workbook as Mock).mockImplementation(() => mockWorkbook);
    (getButtonContent as Mock).mockReturnValue("Import");
    (InsertAuxiliaryBaseMarket as Mock).mockResolvedValue({
      success: true,
      message: "Success",
    });
  });

  describe("Upload Único (Market Entry)", () => {
    it("deve processar arquivo Excel e inserir dados corretamente", async () => {
      mockWorkbook.worksheets[0].getSheetValues.mockReturnValue([
        null,
        null,
        mockMarketData,
      ]);

      render(<ImportButton storageKey="marketEntryData" />);

      const fileInput = screen
        .getByRole("form")
        .querySelector('input[type="file"]') as HTMLInputElement;
      const file = new MockFile(["test"], "test.xlsx");

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      // Verifica processamento correto
      await waitFor(() => {
        expect(mockWorkbook.xlsx.load).toHaveBeenCalled();
        expect(InsertAuxiliaryBaseMarket).toHaveBeenCalledWith(
          [
            {
              obra: "obra1",
              pep: "pep1",
              diagrama: "diag1",
              entrada: "entrada1",
              gpm: "gpm1",
              tipo: "tipo1",
              circuito: "circ1",
              prazoTexto: "prazo1",
              statusOv: "statusOV1",
              statusDiagrama: "statusDiag1",
              statusPep: "statusPep1",
              equipeNumPedido: "equipe1",
              moCliente: "moCliente1",
              moEmpresa: "moEmpresa1",
            },
          ],
          "marketEntryData",
          "insert"
        );
        expect(screen.getByTestId("modal")).toBeInTheDocument();
      });
    });

    it("deve mostrar erro quando API falha", async () => {
      (InsertAuxiliaryBaseMarket as Mock).mockResolvedValue({
        success: false,
        message: "API Error",
      });

      mockWorkbook.worksheets[0].getSheetValues.mockReturnValue([
        null,
        null,
        mockMarketData,
      ]);

      render(<ImportButton storageKey="marketEntryData" />);

      const fileInput = screen
        .getByRole("form")
        .querySelector('input[type="file"]') as HTMLInputElement;
      const file = new MockFile(["test"], "test.xlsx");

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByTestId("error-modal")).toBeInTheDocument();
        expect(screen.getByText("API Error")).toBeInTheDocument();
      });
    });

    it("deve retornar se arquivo ZPSRL não for selecionado", async () => {
      render(<ImportButton storageKey="marketEntryData" />);

      const fileInput = screen
        .getByRole("form")
        .querySelector('input[type="file"]') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: undefined } });
      });

      // Verifica processamento correto
      await waitFor(() => {
        expect(InsertAuxiliaryBaseMarket).not.toHaveBeenCalled();
      });
    });
  });

  describe("Upload IW38 ", () => {
    it("deve processar dois arquivos em sequência corretamente", async () => {
      const mockWorkbook1 = {
        xlsx: { load: vi.fn() },
        worksheets: [
          {
            getSheetValues: vi
              .fn()
              .mockReturnValue([
                null,
                null,
                [
                  "",
                  "tipo1",
                  "",
                  "ordem1",
                  "campo1",
                  "texto1",
                  "conjunto1",
                  "",
                  "pep1",
                  "grp1",
                  "",
                  "",
                  "",
                  "",
                  "",
                  "",
                  "denom1",
                ],
              ]),
          },
        ],
      };

      (ExcelJS.Workbook as Mock).mockImplementation(() => mockWorkbook1);

      (InsertAuxiliaryBaseMarket as Mock).mockResolvedValue({
        success: true,
        insertedCount: 3,
        skippedNotes: ["note2"],
      });

      const { container } = render(<ImportButton storageKey="otherData" />);

      const iw38Input = container.querySelector(
        'input[type="file"]:first-of-type'
      ) as HTMLInputElement;

      const iw38File = new MockFile(["test"], "iw38.xlsx");

      await act(async () => {
        fireEvent.change(iw38Input, { target: { files: [iw38File] } });
      });

      await waitFor(() => {
        expect(groupNoteDate).toHaveBeenCalled();
        expect(InsertAuxiliaryBaseMarket).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId("modal")).toBeInTheDocument();
        expect(screen.getByText(/Notas ignoradas: note2/)).toBeInTheDocument();
      });
    });

    it("deve mostrar erro quando nenhuma obra é inserida", async () => {
      const mockWorkbook1 = {
        xlsx: { load: vi.fn() },
        worksheets: [{ getSheetValues: vi.fn().mockReturnValue([null, null]) }],
      };

      const mockWorkbook2 = {
        xlsx: { load: vi.fn() },
        worksheets: [{ getSheetValues: vi.fn().mockReturnValue([null, null]) }],
      };

      (ExcelJS.Workbook as Mock)
        .mockImplementationOnce(() => mockWorkbook1)
        .mockImplementationOnce(() => mockWorkbook2);

      (groupNoteDate as Mock).mockReturnValue({});
      (createBatches as Mock).mockReturnValue([["batch1"]]);
      (InsertAuxiliaryBaseMarket as Mock).mockResolvedValue({
        success: true,
        insertedCount: 0,
      });

      const { container } = render(<ImportButton storageKey="otherData" />);

      const iw38Input = container.querySelector(
        'input[type="file"]:first-of-type'
      ) as HTMLInputElement;
      const cn52nInput = container.querySelector(
        'input[type="file"]:last-of-type'
      ) as HTMLInputElement;

      const iw38File = new MockFile(["test"], "iw38.xlsx");
      const cn52nFile = new MockFile(["test"], "cn52n.xlsx");

      await act(async () => {
        fireEvent.change(iw38Input, { target: { files: [iw38File] } });
      });

      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 150));
        fireEvent.change(cn52nInput, { target: { files: [cn52nFile] } });
      });

      await waitFor(() => {
        expect(screen.getByTestId("error-modal")).toBeInTheDocument();
        expect(
          screen.getByText("Nenhuma obra foi inserida")
        ).toBeInTheDocument();
      });
    });

    it("deve retornar se arquivo IW38 e CN52N não for selecionado", async () => {
      const { container } = render(
        <ImportButton storageKey="notesEntryData" />
      );

      const iw38Input = container.querySelector(
        'input[type="file"]:first-of-type'
      ) as HTMLInputElement;

      await act(async () => {
        fireEvent.change(iw38Input, { target: { files: undefined } });
      });

      await waitFor(() => {
        expect(InsertAuxiliaryBaseMarket).not.toHaveBeenCalled();
      });
    });
  });

  describe("Tratamento de Erros", () => {
    it("deve capturar erros de processamento de arquivo", async () => {
      mockWorkbook.xlsx.load.mockRejectedValue(
        new Error("File processing error")
      );

      render(<ImportButton storageKey="marketEntryData" />);

      const fileInput = screen
        .getByRole("form")
        .querySelector('input[type="file"]') as HTMLInputElement;
      const file = new MockFile(["test"], "test.xlsx");

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByTestId("error-modal")).toBeInTheDocument();
        expect(screen.getByText("File processing error")).toBeInTheDocument();
      });
    });

    it("deve validar presença de arquivos antes de processar", async () => {
      render(<ImportButton storageKey="marketEntryData" />);

      const fileInput = screen
        .getByRole("form")
        .querySelector('input[type="file"]') as HTMLInputElement;

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [] } });
      });

      // Não deve tentar processar arquivo
      expect(mockWorkbook.xlsx.load).not.toHaveBeenCalled();
    });
  });

  describe("Funcionalidade de Click", () => {
    it("deve abrir file input para marketEntryData quando botão é clicado", () => {
      render(<ImportButton storageKey="marketEntryData" />);

      const fileInput = screen
        .getByRole("form")
        .querySelector('input[type="file"]');
      const clickSpy = vi.spyOn(fileInput as HTMLElement, "click");

      fireEvent.click(screen.getByTestId("import-button"));

      expect(clickSpy).toHaveBeenCalled();
    });

    it("deve abrir file input IW38 para outros storageKeys quando botão é clicado", () => {
      const { container } = render(<ImportButton storageKey="otherData" />);

      const iw38Input = container.querySelector(
        'input[type="file"]:first-of-type'
      );
      const clickSpy = vi.spyOn(iw38Input as HTMLElement, "click");

      fireEvent.click(screen.getByTestId("import-button"));

      expect(clickSpy).toHaveBeenCalled();
    });
  });

  describe("Modal Controls", () => {
    it("deve fechar modal de sucesso", async () => {
      mockWorkbook.worksheets[0].getSheetValues.mockReturnValue([
        null,
        null,
        mockMarketData,
      ]);

      render(<ImportButton storageKey="marketEntryData" />);

      const fileInput = screen
        .getByRole("form")
        .querySelector('input[type="file"]') as HTMLInputElement;
      const file = new MockFile(["test"], "test.xlsx");

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByTestId("modal")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("modal-close"));

      expect(screen.queryByTestId("modal")).not.toBeInTheDocument();
    });

    it("deve fechar modal de erro", async () => {
      (InsertAuxiliaryBaseMarket as Mock).mockResolvedValue({
        success: false,
        message: "Error message",
      });

      mockWorkbook.worksheets[0].getSheetValues.mockReturnValue([
        null,
        null,
        ["", "obra1"],
      ]);

      render(<ImportButton storageKey="marketEntryData" />);

      const fileInput = screen
        .getByRole("form")
        .querySelector('input[type="file"]') as HTMLInputElement;
      const file = new MockFile(["test"], "test.xlsx");

      await act(async () => {
        fireEvent.change(fileInput, { target: { files: [file] } });
      });

      await waitFor(() => {
        expect(screen.getByTestId("error-modal")).toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId("error-close"));

      expect(screen.queryByTestId("error-modal")).not.toBeInTheDocument();
    });
  });
});
