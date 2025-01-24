export const links = [
  { name: "Tela inicial", href: "/", needPermission: false },
  {
    name: "Entrada",
    href: "/entrada",
    needPermission: true,
    submenu: [
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
        name: "Programacao pendente",
        href: "/programacao/pendente",
        needPermission: true,
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
