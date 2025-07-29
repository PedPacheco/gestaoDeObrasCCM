import Loading from "@/app/(dashboard)/loading";
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("@/components/common/Loading", () => ({
  __esModule: true,
  LoadingComponent: ({ color }: any) => (
    <div data-testid="loading-id">
      <svg
        className={`animate-spin ml-1 mr-3 h-5 w-5 ${color}`}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        ></path>
      </svg>
    </div>
  ),
}));

describe("Loading Component", () => {
  it("Deve renderizar o component Loading", () => {
    render(<Loading />);

    expect(screen.getByTestId("loading-id")).toBeInTheDocument();
  });
});
