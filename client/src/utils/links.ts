export const links = [
  { name: "Home", href: "/" },
  {
    name: "Entrada",
    href: "/entrada",
    submenu: [
      { name: "Entrada por data", href: "/entrada/por-data" },
      { name: "Lista geral de obras", href: "/entrada/lista-geral-obras" },
    ],
  },
  {
    name: "Programação",
    href: "/programacao",
    submenu: [
      { name: "Resumo mensal", href: "/programacao/resumo-mensal" },
      { name: "Programação por data", href: "/programacao/por-data" },
      { name: "Programacao semanal", href: "/programacao/semanal" },
      { name: "Programacao mensal", href: "/programacao/mensal" },
      { name: "Programacao pendente", href: "/programacao/pendente" },
      { name: "Restrições", href: "/programacao/restricoes" },
    ],
  },
  { name: "Obras em carteria", href: "/obras-carteira" },
  { name: "Obras executadas", href: "/obras-executadas" },
];
