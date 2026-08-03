import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Dispatch, SetStateAction } from "react";
import { AsBuiltImport } from "@/components/executionReport/asBuiltImport";

// Mock do ErrorModal
vi.mock("@/components/common/ErrorModal", () => ({
  default: ({ onClose, message }: any) => (
    <button data-testid="close-error" onClick={onClose}>
      {message}
    </button>
  ),
}));

// Mock icons
vi.mock("@heroicons/react/20/solid", () => ({
  ExclamationCircleIcon: () => <div />,
  DocumentArrowUpIcon: () => <div />,
  XMarkIcon: () => <div />,
  PhotoIcon: () => <div />,
}));

vi.mock("@/hooks/useFeedback", () => ({
  useFeedback: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
  }),
}));

// Helper para criar arquivos fake
function createFile(name: string, type: string, sizeMB: number) {
  const size = sizeMB * 1024 * 1024;
  return new File(["a".repeat(size)], name, { type });
}

describe("AsBuiltImport", () => {
  let files: File[];
  let setFiles: Dispatch<SetStateAction<File[]>> = vi.fn();

  beforeEach(() => {
    files = [];
    setFiles = vi.fn((updater) => {
      files = updater(files);
    });
  });

  const renderComponent = () =>
    render(<AsBuiltImport files={files} setFiles={setFiles} />);

  it("deve exibir título e elementos base", () => {
    renderComponent();
    expect(screen.getByText("Importar Arquivos As Built")).toBeInTheDocument();
    expect(
      screen.getByText("Clique para selecionar arquivos ou arraste e solte"),
    ).toBeInTheDocument();
  });

  it("deve permitir upload de arquivos válidos", () => {
    const { container } = render(
      <AsBuiltImport files={[]} setFiles={setFiles} />,
    );

    fireEvent.change(container.querySelector('input[type="file"]')!, {
      target: {
        files: [new File(["x"], "teste.pdf", { type: "application/pdf" })],
      },
    });

    expect(setFiles).toHaveBeenCalled();
  });

  // it("deve rejeitar arquivo com tipo inválido", () => {
  //   const { container, queryByTestId } = render(
  //     <AsBuiltImport files={[]} setFiles={setFiles} />,
  //   );

  //   fireEvent.change(container.querySelector('input[type="file"]')!, {
  //     target: {
  //       files: [
  //         new File(["x"], "arquivo.exe", { type: "application/x-msdownload" }),
  //       ],
  //     },
  //   });

  //   expect(queryByTestId("close-error")).toHaveTextContent(
  //     'Arquivo "arquivo.exe" não é PDF ou JPEG.',
  //   );

  //   fireEvent.click(queryByTestId("close-error")!);

  //   expect(queryByTestId("close-error")).not.toBeInTheDocument();
  // });

  // it("deve rejeitar arquivo maior que 5MB", () => {
  //   const bigFile = createFile("grande.pdf", "application/pdf", 6);

  //   const { container, queryByTestId } = render(
  //     <AsBuiltImport files={[]} setFiles={setFiles} />,
  //   );

  //   fireEvent.change(container.querySelector('input[type="file"]')!, {
  //     target: {
  //       files: [bigFile],
  //     },
  //   });

  //   expect(queryByTestId("close-error")).toHaveTextContent(
  //     'Arquivo "grande.pdf" excede 5MB.',
  //   );

  //   fireEvent.click(queryByTestId("close-error")!);

  //   expect(queryByTestId("close-error")).not.toBeInTheDocument();
  // });

  // it("deve impedir upload quando exceder 5 arquivos", () => {
  //   files = [
  //     createFile("1.pdf", "application/pdf", 1),
  //     createFile("2.pdf", "application/pdf", 1),
  //     createFile("3.pdf", "application/pdf", 1),
  //     createFile("4.pdf", "application/pdf", 1),
  //     createFile("5.pdf", "application/pdf", 1),
  //   ];

  //   setFiles = vi.fn((fn) => (files = fn(files)));

  //   const { container, queryByTestId } = render(
  //     <AsBuiltImport files={files} setFiles={setFiles} />,
  //   );

  //   const newFile = createFile("extra.pdf", "application/pdf", 1);

  //   fireEvent.change(container.querySelector('input[type="file"]')!, {
  //     target: {
  //       files: [newFile],
  //     },
  //   });
  // });

  it("deve ativar e desativar o dragActive ao arrastar arquivos", () => {
    renderComponent();

    const area = screen.getByText(
      "Clique para selecionar arquivos ou arraste e solte",
    ).parentElement!;

    fireEvent.dragEnter(area);

    expect(area.className).toContain("bg-blue-900/20");

    const overlay = document.querySelector(".z-50")!;

    fireEvent.dragLeave(overlay);

    expect(area.className).not.toContain("bg-blue-900/20");
  });

  it("deve fazer upload ao soltar arquivos (drop)", () => {
    render(<AsBuiltImport files={[]} setFiles={setFiles} />);

    const area = screen.getByText(
      "Clique para selecionar arquivos ou arraste e solte",
    ).parentElement!;

    const file = new File(["conteudo"], "teste.pdf", {
      type: "application/pdf",
    });

    fireEvent.dragEnter(area);

    const overlay = document.querySelector(".z-50") as HTMLElement;
    expect(overlay).toBeTruthy();

    fireEvent.drop(overlay, {
      dataTransfer: {
        files: [file],
      },
    });

    expect(setFiles).toHaveBeenCalled();
  });

  it("deve remover um arquivo corretamente", () => {
    const file = createFile("file1.pdf", "application/pdf", 1);

    files = [file];

    setFiles = vi.fn((fn) => (files = fn(files)));

    render(<AsBuiltImport files={files} setFiles={setFiles} />);

    const removeButton = screen.getByRole("button");

    fireEvent.click(removeButton);

    expect(setFiles).toHaveBeenCalled();
  });

  it("deve exibir lista de arquivos", () => {
    files = [createFile("item.pdf", "application/pdf", 1)];

    render(<AsBuiltImport files={files} setFiles={setFiles} />);

    expect(screen.getByText("item.pdf")).toBeInTheDocument();
  });
});
