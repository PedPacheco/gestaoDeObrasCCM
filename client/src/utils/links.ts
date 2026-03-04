export type UserAccessLevel = "total" | "parcial" | "sem_permissao";

export function getUserAccessLevel(permissions: any): UserAccessLevel {
  if (permissions?.permissao === "Sem permissão") {
    return "sem_permissao";
  }

  if (permissions?.permissao_visualizacao === "parcial") {
    return "parcial";
  }

  return "total";
}

export const links = [
  {
    name: "Tela inicial",
    href: "/",
    allowedFor: ["total", "parcial", "sem_permissao"],
  },
  {
    name: "Relatórios",
    href: null,
    allowedFor: ["total", "sem_permissao"],
    submenu: [
      {
        name: "Exportações",
        href: "/relatorios/exportacoes",
        allowedFor: ["total", "sem_permissao"],
      },
      {
        name: "Relatório de erros",
        href: "/relatorios/relatorio-erros",
        allowedFor: ["total", "sem_permissao"],
      },
      {
        name: "Relatório BI's",
        href: "/relatorios/relatorio-bi",
        allowedFor: ["total", "sem_permissao"],
      },
    ],
  },
  {
    name: "Metas",
    href: null,
    allowedFor: ["total", "sem_permissao"],
    submenu: [
      {
        name: "Metas Recomposição",
        href: "/metas/recomposicao",
        allowedFor: ["total", "sem_permissao"],
      },
      {
        name: "Metas BT0",
        href: "/metas/btzero",
        allowedFor: ["total", "sem_permissao"],
      },
      {
        name: "Metas RDA",
        href: "/metas/rda",
        allowedFor: ["total", "sem_permissao"],
      },
    ],
  },
  {
    name: "Entrada",
    href: "/entrada",
    allowedFor: ["total"],
    submenu: [
      {
        name: "Importação mercado",
        href: "/entrada/mercado",
        allowedFor: ["total"],
      },
      {
        name: "Importação notas",
        href: "/entrada/notas",
        allowedFor: ["total"],
      },

      {
        name: "Entrada por data",
        href: "/entrada/por-data",
        allowedFor: ["total", "sem_permissao"],
      },
      {
        name: "Lista geral de obras",
        href: "/entrada/lista-geral-obras",
        allowedFor: ["total", "sem_permissao"],
      },
    ],
  },
  {
    name: "Atualizações",
    allowedFor: ["total"],
    submenu: [
      {
        name: "Mercado",
        href: "/atualizacoes/mercado",
        allowedFor: ["total"],
      },
      { name: "Notas", href: "/atualizacoes/notas", allowedFor: ["total"] },
      {
        name: "Material e Serviço",
        href: "/atualizacoes/capex",
        allowedFor: ["total"],
      },
      {
        name: "Empreitamento",
        href: "/atualizacoes/empreitamento",
        allowedFor: ["total"],
      },
      {
        name: "Suspensões",
        href: "/atualizacoes/suspensoes",
        allowedFor: ["total"],
      },
    ],
  },
  {
    name: "Programação",
    href: null,
    allowedFor: ["total", "parcial", "sem_permissao"],
    submenu: [
      {
        name: "Resumo mensal",
        href: "/programacao/resumo-mensal",
        allowedFor: ["total", "parcial", "sem_permissao"],
      },
      {
        name: "Valores Mensais",
        href: "/programacao/valores-mensais",
        allowedFor: ["total", "parcial", "sem_permissao"],
      },
      {
        name: "Programação por data",
        href: "/programacao/por-data",
        allowedFor: ["total", "parcial", "sem_permissao"],
      },
    ],
  },
  {
    name: "Restrições",
    href: null,
    allowedFor: ["total", "sem_permissao"],
    submenu: [
      {
        name: "Restrições Programações",
        href: "/restricoes/programacoes",
        allowedFor: ["total", "sem_permissao"],
      },
      {
        name: "Restrições Publicações",
        href: "/restricoes/publicacoes",
        allowedFor: ["total", "sem_permissao"],
      },
    ],
  },
  {
    name: "Obras em carteira",
    href: "/obras-carteira",
    allowedFor: ["total", "parcial", "sem_permissao"],
  },
  {
    name: "Obras executadas",
    href: "/obras-executadas",
    allowedFor: ["total", "parcial", "sem_permissao"],
  },
  {
    name: "Capacidade de execução",
    href: "/capacidade-execucao",
    allowedFor: ["total", "sem_permissao"],
  },
];
