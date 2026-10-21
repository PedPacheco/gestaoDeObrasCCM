export const EXCLUDE_PARCEIRAS = new Set([
  "EDP",
  "ELETROREDE",
  "MONTELBRAS",
  "COMPEL",
  "ROTARY",
  "NÃO DEFINIDO",
  "NAO DEFINIDO",
]);

export const PARTNERS = [
  { name: "Engelmig", logo: "/engelmig-logo.png" },
  { name: "LIG", logo: "/lig-logo.png" },
  { name: "Start", logo: "/start-logo.png" },
  { name: "Manserv", logo: "/manserv-logo.png" },
  { name: "OCA", logo: "/oca-logo.png" },
  { name: "Cosampa", logo: "/cosampa-logo.png" },
  { name: "Baramaia", logo: "/baramaia-logo.png" },
];

export type Tab =
  | "mao-de-obra"
  | "metas-recomposicao"
  | "acompanhamento-execucao";

export const RESTRICTED_AREA = 9;

export const getInitialTab = (idArea?: number | null): Tab =>
  idArea === RESTRICTED_AREA ? "metas-recomposicao" : "mao-de-obra";

export interface InitialDashboardData {
  labor?: Awaited<ReturnType<typeof import("./loaders").loadMaodeObra>>;
  laborFilters?: Awaited<
    ReturnType<typeof import("./loaders").loadLaborFilters>
  >;
  metas?: Awaited<ReturnType<typeof import("./loaders").loadMetasRecomposicao>>;
  goalsFilters?: Awaited<
    ReturnType<typeof import("./loaders").loadGoalsFilters>
  >;
}
