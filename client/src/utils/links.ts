export type UserAccessLevel =
  | "admin"
  | "interno_editor"
  | "interno_viewer"
  | "parceira";

interface Link {
  name: string;
  href?: string | null;
  allowedFor?: UserAccessLevel[];
  allowedAreas?: number[]; // Vazio ou ausente = todas as áreas
  submenu?: Link[];
}

export function getUserAccessLevel(userPermissions: any): UserAccessLevel {
  if (userPermissions?.is_admin) return "admin";
  if (userPermissions?.tipo_usuario === "PARCEIRA") return "parceira";
  if (
    userPermissions?.tipo_usuario === "INTERNO" &&
    userPermissions?.permissao_edicao
  )
    return "interno_editor";
  return "interno_viewer";
}

export function canAccessLink(link: Link, userPermissions: any): boolean {
  const accessLevel = getUserAccessLevel(userPermissions);

  // Admin acessa tudo
  if (accessLevel === "admin") return true;

  // Verifica nível de acesso
  if (link.allowedFor && !link.allowedFor.includes(accessLevel)) {
    return false;
  }

  // Verifica área do usuário
  if (
    link.allowedAreas?.length &&
    !link.allowedAreas.includes(userPermissions?.id_area) &&
    userPermissions.tipo_usuario === "INTERNO"
  ) {
    return false;
  }

  return true;
}
export const links: Link[] = [
  {
    name: "Tela inicial",
    href: "/",
    allowedFor: ["interno_editor", "interno_viewer", "parceira"],
    allowedAreas: [8, 1],
  },
  {
    name: "Relatórios",
    href: null,
    allowedFor: ["interno_editor", "interno_viewer"],
    allowedAreas: [8, 1],
    submenu: [
      {
        name: "Exportações",
        href: "/relatorios/exportacoes",
        allowedFor: ["interno_editor", "interno_viewer"],
        allowedAreas: [8, 1],
      },
      {
        name: "Relatório de erros",
        href: "/relatorios/relatorio-erros",
        allowedFor: ["interno_editor", "interno_viewer"],
        allowedAreas: [8, 1],
      },
      {
        name: "Repositório",
        href: "/relatorios/relatorio-bi",
        allowedFor: ["interno_editor", "interno_viewer"],
        allowedAreas: [8, 1],
      },
      {
        name: "Relatório Forecast",
        href: "/relatorios/forecast",
        allowedFor: ["interno_editor", "interno_viewer"],
        allowedAreas: [8, 1],
      },
    ],
  },
  {
    name: "Metas",
    href: null,
    allowedFor: ["interno_editor", "interno_viewer"],
    allowedAreas: [8, 1],
    submenu: [
      {
        name: "Metas Recomposição",
        href: "/metas/recomposicao",
        allowedFor: ["interno_editor", "interno_viewer"],
        allowedAreas: [8, 1],
      },
      {
        name: "Metas BT0",
        href: "/metas/btzero",
        allowedFor: ["interno_editor", "interno_viewer"],
        allowedAreas: [8, 1],
      },
      {
        name: "Metas RDA",
        href: "/metas/rda",
        allowedFor: ["interno_editor", "interno_viewer"],
        allowedAreas: [8, 1],
      },
    ],
  },
  {
    name: "Entrada",
    href: "/entrada",
    allowedFor: ["interno_editor", "interno_viewer"],
    allowedAreas: [8, 1],
    submenu: [
      {
        name: "Importação mercado",
        href: "/entrada/mercado",
        allowedFor: ["interno_editor", "interno_viewer"],
        allowedAreas: [8, 1],
      },
      {
        name: "Importação notas",
        href: "/entrada/notas",
        allowedFor: ["interno_editor", "interno_viewer"],
        allowedAreas: [8, 1],
      },

      {
        name: "Entrada por data",
        href: "/entrada/por-data",
        allowedFor: ["interno_editor", "interno_viewer"],
        allowedAreas: [8, 1],
      },
      {
        name: "Lista geral de obras",
        href: "/entrada/lista-geral-obras",
        allowedFor: ["interno_editor", "interno_viewer"],
        allowedAreas: [8, 1],
      },
    ],
  },
  {
    name: "Atualizações",
    allowedFor: ["interno_editor"],
    allowedAreas: [8, 1],
    submenu: [
      {
        name: "Mercado",
        href: "/atualizacoes/mercado",
        allowedFor: ["interno_editor"],
        allowedAreas: [8, 1],
      },
      {
        name: "Notas",
        href: "/atualizacoes/notas",
        allowedFor: ["interno_editor"],
        allowedAreas: [8, 1],
      },
      {
        name: "Material e Serviço",
        href: "/atualizacoes/capex",
        allowedFor: ["interno_editor"],
        allowedAreas: [8, 1],
      },
      {
        name: "Empreitamento",
        href: "/atualizacoes/empreitamento",
        allowedFor: ["interno_editor"],
        allowedAreas: [8, 1],
      },
      {
        name: "Suspensões",
        href: "/atualizacoes/suspensoes",
        allowedFor: ["interno_editor"],
        allowedAreas: [8, 1],
      },
    ],
  },
  {
    name: "Programação",
    href: null,
    allowedFor: ["interno_editor", "interno_viewer", "parceira"],
    allowedAreas: [8, 1, 2, 3, 4, 5, 6, 7],
    submenu: [
      {
        name: "Resumo mensal - Mão de Obra",
        href: "/programacao/resumo-mensal",
        allowedFor: ["interno_editor", "interno_viewer"],
        allowedAreas: [8, 1],
      },
      {
        name: "Resumo mensal - Forecast",
        href: "/programacao/resumo-mensal-forecast",
        allowedFor: ["interno_editor", "interno_viewer"],
        allowedAreas: [8, 1],
      },
      {
        name: "Valores Mensais",
        href: "/programacao/valores-mensais",
        allowedFor: ["interno_editor", "interno_viewer"],
        allowedAreas: [8, 1],
      },
      {
        name: "Programação por data",
        href: "/programacao/por-data",
        allowedFor: ["interno_editor", "interno_viewer", "parceira"],
        allowedAreas: [8, 1, 2, 3, 4, 5, 6, 7],
      },
    ],
  },
  {
    name: "Restrições",
    href: null,
    allowedFor: ["interno_editor", "interno_viewer", "parceira"],
    allowedAreas: [8, 1, 7],
    submenu: [
      {
        name: "Restrições Programações",
        href: "/restricoes/programacoes",
        allowedFor: ["interno_editor", "interno_viewer"],
        allowedAreas: [8, 1],
      },
      {
        name: "Restrições Publicações",
        href: "/restricoes/publicacoes",
        allowedFor: ["interno_editor", "interno_viewer", "parceira"],
        allowedAreas: [8, 1, 7],
      },
    ],
  },
  {
    name: "Mapa de obras",
    href: "/mapa-obras",
    allowedFor: ["interno_editor", "interno_viewer", "parceira"],
    allowedAreas: [8, 1, 2, 3, 4, 5, 6, 7],
  },
  {
    name: "Obras em carteira",
    href: "/obras-carteira",
    allowedFor: ["interno_editor", "interno_viewer", "parceira"],
    allowedAreas: [8, 1],
  },
  {
    name: "Obras executadas",
    href: "/obras-executadas",
    allowedFor: ["interno_editor", "interno_viewer", "parceira"],
    allowedAreas: [8, 1],
  },
  {
    name: "Capacidade de execução",
    href: "/capacidade-execucao",
    allowedFor: ["interno_editor", "interno_viewer", "parceira"],
    allowedAreas: [8, 1],
  },
];
