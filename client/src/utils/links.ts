export const links = [
  { name: "Tela inicial", href: "/", needPermission: false },
  { name: "Exportações", href: "/exportacoes", needPermission: false },
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
    needPermission: false,
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
        needPermission: false,
      },
      {
        name: "Lista geral de obras",
        href: "/entrada/lista-geral-obras",
        needPermission: false,
      },
    ],
  },
  {
    name: "Atualizações",
    needPermission: true,
    submenu: [
      { name: "Mercado", href: "/atualizacoes/mercado", needPermission: true },
      { name: "Notas", href: "/atualizacoes/notas", needPermission: true },
      {
        name: "Material e Serviço",
        href: "/atualizacoes/capex",
        needPermission: true,
      },
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
  {
    name: "Programação",
    href: null,
    needPermission: false,
    submenu: [
      {
        name: "Resumo mensal",
        href: "/programacao/resumo-mensal",
        needPermission: true,
      },
      {
        name: "Valores Mensais",
        href: "/programacao/valores-mensais",
        needPermission: true,
      },
      {
        name: "Programação por data",
        href: "/programacao/por-data",
        needPermission: false,
      },
    ],
  },
  {
    name: "Restrições",
    href: null,
    needPermission: false,
    submenu: [
      {
        name: "Restrições Programações",
        href: "/restricoes/programacoes",
        needPermission: false,
      },
      {
        name: "Restrições Publicações",
        href: "/restricoes/publicacoes",
        needPermission: false,
      },
    ],
  },
  { name: "Mapa de obras", href: "/mapa-obras", needPermission: false },
  { name: "Obras em carteira", href: "/obras-carteira", needPermission: false },
  {
    name: "Obras executadas",
    href: "/obras-executadas",
    needPermission: false,
  },
  {
    name: "Capacidade de execução",
    href: "/capacidade-execucao",
    needPermission: true,
  },
  {
    name: "Relatório de erros",
    href: "/relatorio-erros",
    needPermission: true,
  },
];
