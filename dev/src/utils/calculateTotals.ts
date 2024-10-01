interface TotalsOptions {
  total_mo_planejada?: boolean;
  total_mo_executada?: boolean;
  total_mo_suspensa?: boolean;
  total_qtde_planejada?: boolean;
  total_qtde_pend?: boolean;
}

export function calculateTotals(works, options: TotalsOptions) {
  let total_obras = 0;
  let total_mo_planejada = 0;
  let total_mo_executada = 0;
  let total_mo_suspensa = 0;
  let total_qtde_planejada = 0;
  let total_qtde_pend = 0;

  const updatedWorks = works.map((obra) => {
    total_obras++;

    if (options.total_mo_planejada) {
      total_mo_planejada += obra.mo_planejada;
    }

    if (options.total_mo_executada) {
      const mo_executada = (obra.mo_planejada * obra.executado) / 100;
      total_mo_executada += mo_executada;

      if (options.total_mo_suspensa && obra.id_status === 4) {
        total_mo_suspensa += mo_executada;
      }
    }

    if (options.total_qtde_planejada) {
      total_qtde_planejada += obra.qtde_planejada;
    }

    if (options.total_qtde_pend) {
      total_qtde_pend += obra.qtde_pend;
    }

    const prazo_fim = new Date(obra.entrada);
    prazo_fim.setDate(prazo_fim.getDate() + obra.prazo);

    return {
      ...obra,
      prazo_fim,
    };
  });

  return updatedWorks.map((obra) => ({
    ...obra,
    total_obras,
    ...(options.total_mo_planejada && { total_mo_planejada }),
    ...(options.total_mo_executada && { total_mo_executada }),
    ...(options.total_mo_suspensa && { total_mo_suspensa }),
    ...(options.total_qtde_planejada && { total_qtde_planejada }),
    ...(options.total_qtde_pend && { total_qtde_pend }),
  }));
}
