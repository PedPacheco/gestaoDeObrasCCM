SELECT
  row_number() OVER () AS id,
  obras.ovnota,
  obras.pep,
  CASE
    WHEN (obras.diagrama IS NULL) THEN COALESCE(obras.ordem_dci, obras.ordem_dcim)
    ELSE obras.diagrama
  END AS ordemdiagrama,
  obras.ordem_dcd,
  obras.ordem_dca,
  obras.ordem_dcim,
  regionais.regional,
  municipios.mun,
  obras.entrada,
  obras.data_conclusao,
  (obras.entrada + obras.prazo) AS prazofim,
  tipos.tipo_obra,
  obras.qtde_planejada,
  obras.qtde_pend,
  circuitos.circuito,
  obras.mo_planejada,
  (
    (
      obras.mo_planejada * (obras.executado) :: double precision
    ) / (100) :: double precision
  ) AS mo_exec,
  CASE
    WHEN (obras.id_status = 4) THEN (
      obras.mo_planejada - (
        (
          obras.mo_planejada * (obras.executado) :: double precision
        ) / (100) :: double precision
      )
    )
    ELSE (0) :: double precision
  END AS mo_suspensa,
  obras.observ_obra,
  turmas.turma,
  obras.executado,
  STATUS.status,
  (obras.capex_mat_plan + obras.capex_mo_plan) AS capex_plan,
  (obras.capex_mat_pend + obras.capex_mo_pend) AS capex_pend,
  obras.capex_mat_plan,
  obras.capex_mo_plan,
  obras.capex_mat_pend,
  obras.capex_mo_pend,
  conjuntos.conjunto,
  obras.data_viabilidade,
  obras.prazo_viabilidade
FROM
  (
    (
      (
        (
          (
            (
              (
                conjuntos
                JOIN circuitos ON ((circuitos.id_conjunto = conjuntos.id))
              )
              JOIN obras ON ((obras.id_circuito = circuitos.id))
            )
            JOIN turmas ON ((turmas.id = obras.id_turma))
          )
          JOIN municipios ON ((municipios.id = obras.id_gpm))
        )
        JOIN regionais ON ((regionais.id = municipios.id_regional))
      )
      JOIN STATUS ON ((STATUS.id = obras.id_status))
    )
    JOIN tipos ON ((tipos.id = obras.id_tipo))
  )
WHERE
  (obras.data_conclusao IS NOT NULL)
GROUP BY
  obras.ovnota,
  obras.pep,
  obras.diagrama,
  obras.ordem_dci,
  obras.ordem_dcim,
  obras.ordem_dcd,
  obras.ordem_dca,
  regionais.regional,
  municipios.mun,
  obras.entrada,
  obras.data_conclusao,
  obras.prazo,
  tipos.tipo_obra,
  obras.qtde_planejada,
  obras.qtde_pend,
  circuitos.circuito,
  obras.mo_planejada,
  obras.executado,
  obras.id_status,
  obras.observ_obra,
  turmas.turma,
  STATUS.status,
  obras.capex_mat_plan,
  obras.capex_mo_plan,
  obras.capex_mat_pend,
  obras.capex_mo_pend,
  conjuntos.conjunto,
  obras.data_viabilidade,
  obras.prazo_viabilidade
ORDER BY
  obras.data_conclusao DESC,
  obras.entrada DESC;