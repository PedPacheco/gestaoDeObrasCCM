export const links = [
  { name: "Tela inicial", href: "/", needPermission: false },
  {
    name: "Metas",
    href: null,
    needPermission: true,
    submenu: [
      {
        name: "Metas Recomposição",
        href: "/metas/recomposicao",
        needPermission: true,
      },
      {
        name: "Metas BT0",
        href: "/metas/btzero",
        needPermission: true,
      },
      {
        name: "Metas RDA",
        href: "/metas/rda",
        needPermission: true,
      },
    ],
  },
  {
    name: "Entrada",
    href: "/entrada",
    needPermission: true,
    submenu: [
      {
        name: "Importação mercado",
        href: "/entrada/mercado",
        needPermission: true,
      },
      {
        name: "Importação notas",
        href: "/entrada/notas",
        needPermission: true,
      },

      {
        name: "Entrada por data",
        href: "/entrada/por-data",
        needPermission: true,
      },
      {
        name: "Lista geral de obras",
        href: "/entrada/lista-geral-obras",
        needPermission: true,
      },
    ],
  },
  {
    name: "Atualizações",
    needPermission: true,
    submenu: [
      { name: "Mercado", href: "/atualizacoes/mercado", needPermission: true },
      { name: "Notas", href: "/atualizacoes/notas", needPermission: true },
      { name: "Capex - MO", href: "/atualizacoes/capex", needPermission: true },
      {
        name: "Empreitamento",
        href: "/atualizacoes/empreitamento",
        needPermission: true,
      },
      {
        name: "Suspensões",
        href: "/atualizacoes/suspensoes",
        needPermission: true,
      },
    ],
  },
  { name: "Exportações", href: "/exportacoes", needPermission: true },
  {
    name: "Programação",
    href: "/programacao",
    needPermission: false,
    submenu: [
      {
        name: "Resumo mensal",
        href: "/programacao/resumo-mensal",
        needPermission: true,
      },
      {
        name: "Programação por data",
        href: "/programacao/por-data",
        needPermission: false,
      },
      {
        name: "Programacao semanal",
        href: "/programacao/semanal",
        needPermission: false,
      },
      {
        name: "Restrições",
        href: "/programacao/restricoes",
        needPermission: true,
      },
    ],
  },
  { name: "Obras em carteira", href: "/obras-carteira", needPermission: false },
  {
    name: "Obras executadas",
    href: "/obras-executadas",
    needPermission: false,
  },
];
