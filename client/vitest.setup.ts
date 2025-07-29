import "@testing-library/jest-dom/vitest";
import { afterEach, vi } from "vitest";

// Mock para Next.js router
vi.mock("next/navigation", () => ({
  usePathname: vi.fn(() => "/obras/obras-carteira"),
  useRouter: vi.fn(() => ({
    push: vi.fn(),
    replace: vi.fn(),
    back: vi.fn(),
  })),
}));

// Mock para next/dynamic
vi.mock("next/dynamic", () => ({
  default: (factory: Function, options: any) => {
    const Component = factory();
    Component.displayName = "DynamicComponent";
    return Component;
  },
}));

// Define valores de ambiente para testes
process.env.NEXT_PUBLIC_API_URL = "https://api.example.com";

// Global fetch mock
global.fetch = vi.fn();

// Limpeza de mocks após cada teste
afterEach(() => {
  vi.restoreAllMocks();
});
