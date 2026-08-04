export const SECTOR_COLORS: Record<string, string> = {
  Segurança: "bg-red-500",
  "GO Contrato": "bg-blue-500",
  "Engenheiro CCM": "bg-purple-500",
  Parceira: "bg-amber-500",
  "GO Contrato + GO Segurança": "bg-teal-500",
  "Dono de Área": "bg-green-500",
};

export const PARTNER_LOGOS: Record<string, string> = {
  MANSERV: "/manserv-logo.png",
  START: "/start-logo.png",
  LIG: "/lig-logo.png",
  COMPEL: "/compel-logo.png",
  ENGELMIG: "/engelmig-logo.png",
  COSAMPA: "/cosampa-logo.png",
  OCA: "/oca-logo.png",
  BARAMAIA: "/baramaia-logo.png",
};

export const ACTION_PLAN_SECTION_HEADER_GROUPS = [
  {
    label: "Planejado",
    colSpan: 1,
    className:
      "!bg-emerald-500/10 !text-emerald-300 !border-b !border-emerald-500/20",
    children: [
      {
        label: "Qtd. Ações",
        className: "!bg-emerald-500/5 !text-emerald-300",
      },
    ],
  },
  {
    label: "Executado",
    colSpan: 3,
    className:
      "!bg-emerald-500/20 !text-emerald-200 !border-b !border-emerald-500/20",
    children: [
      {
        label: "No Prazo",
        className: "!bg-emerald-500/10 !text-emerald-300",
      },
      {
        label: "Fora Prazo",
        className: "!bg-emerald-500/10 !text-emerald-300",
      },
      {
        label: "Evolução",
        className:
          "!bg-emerald-500/10 !text-emerald-300 !border-r-2 !border-emerald-500/20",
      },
    ],
  },
  {
    label: "Pendente",
    colSpan: 2,
    className: "!bg-blue-500/10 !text-blue-300 !border-b !border-blue-500/20",
    children: [
      {
        label: "No Prazo",
        className: "!bg-blue-500/5 !text-blue-300",
      },
      {
        label: "Fora do Prazo",
        className: "!bg-blue-500/5 !text-blue-300",
      },
    ],
  },
];
