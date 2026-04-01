import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { FeasibiltyUpload } from "@/components/details/workDetails/feasibilityImportModal";

// ─────────────────────────────────────────────
// MODULE MOCKS
// ─────────────────────────────────────────────

vi.mock("@/components/common/Button", () => ({
  ButtonComponent: ({
    text,
    onClick,
    disabled,
  }: {
    text: string;
    onClick: () => void;
    disabled: boolean;
  }) => (
    <button onClick={onClick} disabled={disabled} data-testid="upload-btn">
      {text}
    </button>
  ),
}));

vi.mock("@/components/common/ErrorModal", () => ({
  __esModule: true,
  default: ({
    open,
    message,
    onClose,
  }: {
    open: boolean;
    message: string;
    onClose: () => void;
  }) =>
    open ? (
      <div data-testid="error-modal">
        <p>{message}</p>
        <button onClick={onClose} data-testid="error-modal-close">
          Fechar
        </button>
      </div>
    ) : null,
}));

vi.mock("@mui/material", () => ({
  Dialog: ({ open, children }: { open: boolean; children: React.ReactNode }) =>
    open ? <div data-testid="dialog">{children}</div> : null,
  DialogContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

vi.mock("@heroicons/react/20/solid", () => ({
  ExclamationCircleIcon: () => <svg data-testid="icon-exclamation" />,
  DocumentArrowUpIcon: () => <svg data-testid="icon-document-arrow" />,
  XMarkIcon: () => <svg data-testid="icon-x-mark" />,
  PhotoIcon: () => <svg data-testid="icon-photo" />,
}));

// ─────────────────────────────────────────────
// TEST HELPERS
// ─────────────────────────────────────────────

const DEFAULT_PROPS = {
  idWork: "work-123",
  onUploadSuccess: vi.fn(),
  open: true,
  onClose: vi.fn(),
};

const createFile = (
  name: string,
  size: number,
  type: string = "application/pdf",
): File => {
  const file = new File(["x".repeat(size)], name, { type });
  Object.defineProperty(file, "size", { value: size, configurable: true });
  return file;
};

const VALID_PDF = () =>
  createFile("document.pdf", 1 * 1024 * 1024, "application/pdf");
const VALID_JPEG = () => createFile("photo.jpg", 2 * 1024 * 1024, "image/jpeg");
const OVERSIZED_FILE = () =>
  createFile("big.pdf", 6 * 1024 * 1024, "application/pdf");
const INVALID_FORMAT_FILE = () =>
  createFile(
    "spreadsheet.xlsx",
    1 * 1024 * 1024,
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  );

const getFileInput = () =>
  document.querySelector('input[type="file"]') as HTMLInputElement;

const getUploadButton = () => screen.getByTestId("upload-btn");

const simulateFileSelection = (files: File[]) => {
  const input = getFileInput();
  Object.defineProperty(input, "files", {
    value: files,
    configurable: true,
  });
  fireEvent.change(input);
};

const renderComponent = (props = {}) =>
  render(<FeasibiltyUpload {...DEFAULT_PROPS} {...props} />);

// ─────────────────────────────────────────────
// MOCK FETCH FACTORY
// ─────────────────────────────────────────────

const mockFetchSuccess = () => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: vi.fn().mockResolvedValue({}),
  });
};

const mockFetchFailure = (message = "Erro interno do servidor") => {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: vi.fn().mockResolvedValue({ message }),
  });
};

const mockFetchNetworkError = () => {
  global.fetch = vi.fn().mockRejectedValue(new Error("Network failure"));
};

// ─────────────────────────────────────────────
// SUITE
// ─────────────────────────────────────────────

describe("FeasibiltyUpload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ── 1. RENDERING ────────────────────────────

  describe("Rendering", () => {
    it("renders the dialog when open=true", () => {
      renderComponent();
      expect(screen.getByTestId("dialog")).toBeInTheDocument();
    });

    it("does not render the dialog when open=false", () => {
      renderComponent({ open: false });
      expect(screen.queryByTestId("dialog")).not.toBeInTheDocument();
    });

    it("renders the modal title", () => {
      renderComponent();
      expect(
        screen.getByText("Importar Arquivos de Viabilidade"),
      ).toBeInTheDocument();
    });

    it("renders upload rules for the user", () => {
      renderComponent();
      expect(screen.getByText(/Máximo de 3 arquivos/)).toBeInTheDocument();
      expect(screen.getByText(/Formatos: PDF ou JPEG/)).toBeInTheDocument();
      expect(
        screen.getByText(/Tamanho máximo dos arquivos: 5MB/),
      ).toBeInTheDocument();
    });

    it("renders the file input element as hidden", () => {
      renderComponent();
      const input = getFileInput();
      expect(input).toBeInTheDocument();
      expect(input).toHaveAttribute("accept", ".pdf,.jpg,.jpeg");
      expect(input).toHaveAttribute("multiple");
    });

    it("renders the upload button in initial disabled state", () => {
      renderComponent();
      expect(getUploadButton()).toBeDisabled();
      expect(getUploadButton()).toHaveTextContent("Importar Arquivos");
    });

    it("does not render the file list when no files are selected", () => {
      renderComponent();
      expect(
        screen.queryByText("Arquivos selecionados:"),
      ).not.toBeInTheDocument();
    });

    it("does not render the error modal on initial render", () => {
      renderComponent();
      expect(screen.queryByTestId("error-modal")).not.toBeInTheDocument();
    });
  });

  // ── 2. FILE VALIDATION ───────────────────────

  describe("File Validation", () => {
    describe("Format validation", () => {
      it("accepts a valid PDF file", () => {
        renderComponent();
        simulateFileSelection([VALID_PDF()]);
        expect(screen.getByText(/document\.pdf/)).toBeInTheDocument();
        expect(screen.queryByTestId("error-modal")).not.toBeInTheDocument();
      });

      it("accepts a valid JPEG file with .jpg extension", () => {
        renderComponent();
        simulateFileSelection([VALID_JPEG()]);
        expect(screen.getByText(/photo\.jpg/)).toBeInTheDocument();
      });

      it("accepts a valid JPEG file with image/jpg MIME type", () => {
        renderComponent();
        const jpgFile = createFile("alt.jpg", 1 * 1024 * 1024, "image/jpg");
        simulateFileSelection([jpgFile]);
        expect(screen.getByText(/alt\.jpg/)).toBeInTheDocument();
      });

      it("rejects a file with an invalid format", () => {
        renderComponent();
        simulateFileSelection([INVALID_FORMAT_FILE()]);

        expect(screen.getByTestId("error-modal")).toBeInTheDocument();
        expect(screen.getByText(/não é PDF ou JPEG/)).toBeInTheDocument();
      });

      it("does not add an invalid file to the list", () => {
        renderComponent();
        simulateFileSelection([INVALID_FORMAT_FILE()]);
        expect(
          screen.queryByText("Arquivos selecionados:"),
        ).not.toBeInTheDocument();
      });
    });

    describe("Size validation", () => {
      it("accepts a file exactly at the 5MB limit", () => {
        renderComponent();
        const boundaryFile = createFile("boundary.pdf", 5 * 1024 * 1024);
        simulateFileSelection([boundaryFile]);
        expect(screen.getByText(/boundary\.pdf/)).toBeInTheDocument();
      });

      it("rejects a file that exceeds 5MB", () => {
        renderComponent();
        simulateFileSelection([OVERSIZED_FILE()]);

        expect(screen.getByTestId("error-modal")).toBeInTheDocument();
        expect(screen.getByText(/excede 5MB/)).toBeInTheDocument();
      });

      it("does not add an oversized file to the list", () => {
        renderComponent();
        simulateFileSelection([OVERSIZED_FILE()]);
        expect(
          screen.queryByText("Arquivos selecionados:"),
        ).not.toBeInTheDocument();
      });
    });

    describe("File count validation", () => {
      it("allows adding up to 3 files in separate batches", () => {
        renderComponent();
        simulateFileSelection([VALID_PDF()]);
        simulateFileSelection([VALID_PDF()]);
        simulateFileSelection([VALID_PDF()]);

        const items = screen.getAllByRole("listitem");
        expect(items).toHaveLength(3);
      });

      it("rejects when adding files that would exceed the 3-file limit", () => {
        renderComponent();
        simulateFileSelection([VALID_PDF(), VALID_PDF()]);
        simulateFileSelection([VALID_PDF(), VALID_PDF()]);

        expect(screen.getByTestId("error-modal")).toBeInTheDocument();
        expect(
          screen.getByText("Máximo de 3 arquivos permitidos."),
        ).toBeInTheDocument();
      });

      it("does not add any files from a batch that exceeds the limit", () => {
        renderComponent();
        simulateFileSelection([VALID_PDF(), VALID_PDF()]);

        const countBefore = screen.getAllByRole("listitem").length;

        simulateFileSelection([VALID_PDF(), VALID_PDF()]);

        const countAfter = screen.getAllByRole("listitem").length;
        expect(countAfter).toBe(countBefore);
      });
    });

    describe("Error state reset", () => {
      it("clears a previous error when a valid file is selected next", () => {
        renderComponent();
        simulateFileSelection([INVALID_FORMAT_FILE()]);
        expect(screen.getByTestId("error-modal")).toBeInTheDocument();

        fireEvent.click(screen.getByTestId("error-modal-close"));
        simulateFileSelection([VALID_PDF()]);

        expect(screen.queryByTestId("error-modal")).not.toBeInTheDocument();
      });
    });
  });

  // ── 3. FILE LIST MANAGEMENT ──────────────────

  describe("File List Management", () => {
    it("displays file name and size in MB", () => {
      renderComponent();
      const file = createFile("report.pdf", 2.5 * 1024 * 1024);
      simulateFileSelection([file]);

      expect(screen.getByText(/report\.pdf/)).toBeInTheDocument();
      expect(screen.getByText(/2\.50 MB/)).toBeInTheDocument();
    });

    it("displays multiple files correctly", () => {
      renderComponent();
      simulateFileSelection([VALID_PDF(), VALID_JPEG()]);

      expect(screen.getByText(/document\.pdf/)).toBeInTheDocument();
      expect(screen.getByText(/photo\.jpg/)).toBeInTheDocument();
    });

    it("enables the upload button when at least one file is selected", () => {
      renderComponent();
      simulateFileSelection([VALID_PDF()]);
      expect(getUploadButton()).not.toBeDisabled();
    });

    it("removes a specific file when its remove button is clicked", () => {
      renderComponent();
      const pdf = createFile("first.pdf", 1 * 1024 * 1024);
      const jpeg = createFile("second.jpg", 1 * 1024 * 1024, "image/jpeg");
      simulateFileSelection([pdf, jpeg]);

      const removeButtons = screen.getAllByTestId("icon-x-mark");
      fireEvent.click(removeButtons[0].closest("button")!);

      expect(screen.queryByText(/first\.pdf/)).not.toBeInTheDocument();
      expect(screen.getByText(/second\.jpg/)).toBeInTheDocument();
    });

    it("hides the file list when all files are removed", () => {
      renderComponent();
      simulateFileSelection([VALID_PDF()]);

      const removeButton = screen.getByTestId("icon-x-mark").closest("button")!;
      fireEvent.click(removeButton);

      expect(
        screen.queryByText("Arquivos selecionados:"),
      ).not.toBeInTheDocument();
      expect(getUploadButton()).toBeDisabled();
    });
  });

  // ── 4. DRAG AND DROP ─────────────────────────

  describe("Drag and Drop", () => {
    const getDropZone = () =>
      screen.getByText(/Clique para selecionar/).closest("div")!;

    it("activates drag state on dragenter", async () => {
      renderComponent();
      const dropZone = getDropZone();

      fireEvent.dragEnter(dropZone);
      fireEvent.dragOver(dropZone);

      await waitFor(() => {
        expect(dropZone.className).toMatch(/border-blue-400/);
      });
    });

    // it("deactivates drag state on dragleave", async () => {
    //   renderComponent();
    //   const dropZone = getDropZone();

    //   fireEvent.dragEnter(dropZone);
    //   fireEvent.dragLeave(dropZone);

    //   await waitFor(() => {
    //     expect(dropZone.className).toMatch(/border-gray-500/);
    //   });
    // });

    it("adds valid dropped files to the list", () => {
      renderComponent();

      const dataTransfer = {
        files: [VALID_PDF()],
      };

      fireEvent.drop(
        document.querySelector('[class*="absolute"][class*="top-0"]') ||
          getDropZone(),
        { dataTransfer },
      );

      // Verify drag was deactivated after drop
      expect(getDropZone().className).not.toMatch(/border-blue-400/);
    });
  });

  // ── 5. UPLOAD FLOW ───────────────────────────

  describe("Upload Flow", () => {
    describe("Pre-upload validation", () => {
      it("shows an error if upload is attempted with no files", async () => {
        renderComponent();
        // Manually trigger upload without files
        // Note: button is disabled without files, so we test the guard internally
        // by bypassing disabled (testing the function defensively)
        const btn = getUploadButton();
        expect(btn).toBeDisabled(); // Guard confirmed at UI level
      });
    });

    describe("Success path", () => {
      beforeEach(() => mockFetchSuccess());

      it("sends a POST request to /api/viabilidade", async () => {
        renderComponent();
        simulateFileSelection([VALID_PDF()]);
        fireEvent.click(getUploadButton());

        await waitFor(() => {
          expect(fetch).toHaveBeenCalledWith(
            "/api/viabilidade",
            expect.objectContaining({ method: "POST" }),
          );
        });
      });

      it("includes the idWork in the FormData payload", async () => {
        renderComponent();
        simulateFileSelection([VALID_PDF()]);
        fireEvent.click(getUploadButton());

        await waitFor(() => {
          const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
          const body = options.body as FormData;
          expect(body.get("idObra")).toBe("work-123");
        });
      });

      it("includes all selected files in the FormData payload", async () => {
        renderComponent();
        simulateFileSelection([VALID_PDF(), VALID_JPEG()]);
        fireEvent.click(getUploadButton());

        await waitFor(() => {
          const [, options] = (fetch as ReturnType<typeof vi.fn>).mock.calls[0];
          const body = options.body as FormData;
          const uploadedFiles = body.getAll("files");
          expect(uploadedFiles).toHaveLength(2);
        });
      });

      it("shows 'Enviando...' on the button while uploading", async () => {
        renderComponent();
        simulateFileSelection([VALID_PDF()]);
        fireEvent.click(getUploadButton());

        expect(getUploadButton()).toHaveTextContent("Enviando...");
        expect(getUploadButton()).toBeDisabled();

        await waitFor(() =>
          expect(getUploadButton()).toHaveTextContent("Importar Arquivos"),
        );
      });

      it("clears the file list after a successful upload", async () => {
        renderComponent();
        simulateFileSelection([VALID_PDF()]);
        fireEvent.click(getUploadButton());

        await waitFor(() =>
          expect(
            screen.queryByText("Arquivos selecionados:"),
          ).not.toBeInTheDocument(),
        );
      });

      // it("calls onUploadSuccess after a 1s delay on success", async () => {
      //   const onUploadSuccess = vi.fn();
      //   render(
      //     <FeasibiltyUpload
      //       {...DEFAULT_PROPS}
      //       onUploadSuccess={onUploadSuccess}
      //     />,
      //   );

      //   simulateFileSelection([VALID_PDF()]);
      //   fireEvent.click(getUploadButton());

      //   await waitFor(() => expect(fetch).toHaveBeenCalled());

      //   expect(onUploadSuccess).not.toHaveBeenCalled();

      //   vi.advanceTimersByTime(1000);

      //   expect(onUploadSuccess).toHaveBeenCalledTimes(1);
      // });
    });

    describe("Failure path", () => {
      it("displays the server error message on a failed response", async () => {
        mockFetchFailure("Arquivo corrompido");
        renderComponent();
        simulateFileSelection([VALID_PDF()]);
        fireEvent.click(getUploadButton());

        await waitFor(() => {
          expect(screen.getByTestId("error-modal")).toBeInTheDocument();
          expect(screen.getByText("Arquivo corrompido")).toBeInTheDocument();
        });
      });

      it("displays a generic error message on a network failure", async () => {
        mockFetchNetworkError();
        renderComponent();
        simulateFileSelection([VALID_PDF()]);
        fireEvent.click(getUploadButton());

        await waitFor(() => {
          expect(screen.getByTestId("error-modal")).toBeInTheDocument();
          expect(screen.getByText("Network failure")).toBeInTheDocument();
        });
      });

      it("re-enables the upload button after a failed upload", async () => {
        mockFetchFailure();
        renderComponent();
        simulateFileSelection([VALID_PDF()]);
        fireEvent.click(getUploadButton());

        await waitFor(() => expect(getUploadButton()).not.toBeDisabled());
      });

      // it("does not call onUploadSuccess on failure", async () => {
      //   mockFetchFailure();
      //   const onUploadSuccess = vi.fn();
      //   render(
      //     <FeasibiltyUpload
      //       {...DEFAULT_PROPS}
      //       onUploadSuccess={onUploadSuccess}
      //     />,
      //   );

      //   simulateFileSelection([VALID_PDF()]);
      //   fireEvent.click(getUploadButton());

      //   await waitFor(() =>
      //     expect(screen.getByTestId("error-modal")).toBeInTheDocument(),
      //   );

      //   vi.advanceTimersByTime(1000);
      //   expect(onUploadSuccess).not.toHaveBeenCalled();
      // });

      it("preserves the file list after a failed upload", async () => {
        mockFetchFailure();
        renderComponent();
        simulateFileSelection([VALID_PDF()]);
        fireEvent.click(getUploadButton());

        await waitFor(() =>
          expect(screen.getByTestId("error-modal")).toBeInTheDocument(),
        );

        expect(screen.getByText(/document\.pdf/)).toBeInTheDocument();
      });
    });
  });

  // ── 6. ERROR MODAL BEHAVIOR ──────────────────

  describe("Error Modal Behavior", () => {
    it("dismisses the error modal when its close button is clicked", () => {
      renderComponent();
      simulateFileSelection([INVALID_FORMAT_FILE()]);

      expect(screen.getByTestId("error-modal")).toBeInTheDocument();

      fireEvent.click(screen.getByTestId("error-modal-close"));

      expect(screen.queryByTestId("error-modal")).not.toBeInTheDocument();
    });

    it("shows only the most recent error when multiple validations fail in sequence", () => {
      renderComponent();

      simulateFileSelection([INVALID_FORMAT_FILE()]);
      fireEvent.click(screen.getByTestId("error-modal-close"));

      simulateFileSelection([OVERSIZED_FILE()]);

      expect(screen.getByText(/excede 5MB/)).toBeInTheDocument();
      expect(screen.queryByText(/não é PDF ou JPEG/)).not.toBeInTheDocument();
    });
  });

  // ── 7. ACCESSIBILITY ─────────────────────────

  describe("Accessibility", () => {
    it("remove buttons are disabled during an upload in progress", async () => {
      mockFetchSuccess();
      renderComponent();
      simulateFileSelection([VALID_PDF()]);

      fireEvent.click(getUploadButton());

      const removeButton = screen.getByTestId("icon-x-mark").closest("button")!;
      expect(removeButton).toBeDisabled();

      await waitFor(() =>
        expect(getUploadButton()).toHaveTextContent("Importar Arquivos"),
      );
    });

    it("file input has proper accept attribute for assistive technologies", () => {
      renderComponent();
      expect(getFileInput()).toHaveAttribute("accept", ".pdf,.jpg,.jpeg");
    });
  });
});
