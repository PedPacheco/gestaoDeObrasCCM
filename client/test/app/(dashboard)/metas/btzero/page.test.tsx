import { vi } from "vitest";

vi.mock("@/actions/fetchData.action", () => ({
  fetchData: vi.fn(),
}));

vi.mock("@/actions/fetchFilters.action", () => ({
  fetchFilters: vi.fn(),
}));

vi.mock("next/headers", () => ({
  cookies: vi.fn(),
}));

vi.mock("@/components/goalsComponents/MainGoals", () => ({
  __esModule: true,
  default: vi.fn(({ data, token, filtersData, columns, typeGoals }) => (
    <div
      data-testid="main-all-works"
      data-data={JSON.stringify(data.works)}
      data-filters={JSON.stringify(filtersData)}
      data-token={token}
      data-columns={JSON.stringify(columns)}
      data-typeGoals={typeGoals}
    >
      Main Goals
    </div>
  )),
}));

vi.mock("@/utils/transform", () => ({
  Transform: vi.fn((filters: Record<string, string[]>) => {
    return Object.fromEntries(
      Object.entries(filters).map(([key, value]) => [
        key,
        Array.isArray(value) && value.length > 0 ? value.join(",") : "",
      ])
    );
  }),
}));
