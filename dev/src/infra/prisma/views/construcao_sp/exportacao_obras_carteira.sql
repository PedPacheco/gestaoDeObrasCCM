SELECT
  row_number() OVER () AS id,
  obras.id AS id_obra,
  obras.ovnota,
  obras.pep,
  CASE
    WHEN (obras.diagrama IS NULL) THEN COALESCE(obras.ordem_dci, obras.ordem_dcim)
    ELSE obras.diagrama
  END AS ordemdiagrama,
  obras.ordem_dcd,
  obras.ordem_dca,
  obras.ordem_dcim,
  municipios.mun,
  regionais.regional,
  (obras.entrada + obras.prazo) AS prazofim,
  CASE
    WHEN (CURRENT_DATE > (obras.entrada + obras.prazo)) THEN 1
    ELSE 0
  END AS atraso,
  tipos.tipo_obra,
  obras.qtde_planejada,
  obras.qtde_pend,
  circuitos.circuito,
  obras.mo_planejada,
  (
    (obras.mo_planejada * obras.executado) / (100) :: double precision
  ) AS mo_exec,
  CASE
    WHEN (obras.id_status = 4) THEN (
      obras.mo_planejada - (
        (obras.mo_planejada * obras.executado) / (100) :: double precision
      )
    )
    ELSE (0) :: double precision
  END AS mo_suspensa,
  obras.observ_obra,
  turmas.turma,
  obras.executado,
  obras.entrada,
  dp.min_data_prog,
  dp.max_data_prog,
  STATUS.status,
  (obras.capex_mat_plan + obras.capex_mo_plan) AS capex_plan,
  (obras.capex_mat_pend + obras.capex_mo_pend) AS capex_pend,
  obras.capex_mat_plan,
  obras.capex_mo_plan,
  obras.capex_mat_pend,
  obras.capex_mo_pend,
  (
    SELECT
      count(*) AS count
    FROM
      programacoes p
    WHERE
      (p.id_obra = obras.id)
  ) AS contagem_de_ocorrencias,
  dp.hora_ini,
  dp.hora_ter,
  conjuntos.conjunto,
  dp.tipo_servico,
  dp.chi,
  dp.equipe_linha_morta,
  dp.equipe_regularizacao,
  dp.equipe_linha_viva,
  dp.num_dp,
  grupos.grupo,
  obras.referencia,
  obras.data_empreitamento,
  empreendimento.empreendimento,
  relatorio_viabilidade.data_envio,
  relatorio_viabilidade.prazo_viabilidade,
  obras.ano_plan
FROM
  (
    (
      (
        (
          (
            (
              (
                (
                  (
                    (
                      (
                        obras
                        LEFT JOIN datas_de_programacao dp ON ((obras.id = dp.id))
                      )
                      JOIN municipios ON ((municipios.id = obras.id_gpm))
                    )
                    JOIN STATUS ON ((STATUS.id = obras.id_status))
                  )
                  JOIN tipos ON ((tipos.id = obras.id_tipo))
                )
                JOIN grupos ON ((grupos.id = tipos.id_grupo))
              )
              JOIN circuitos ON ((circuitos.id = obras.id_circuito))
            )
            JOIN conjuntos ON ((conjuntos.id = circuitos.id_conjunto))
          )
          JOIN turmas ON ((turmas.id = obras.id_turma))
        )
        JOIN regionais ON ((regionais.id = municipios.id_regional))
      )
      LEFT JOIN relatorio_viabilidade ON ((relatorio_viabilidade.id_obra = obras.id))
    )
    LEFT JOIN empreendimento ON ((empreendimento.id = obras.id_empreendimento))
  )
WHERE
  (obras.data_conclusao IS NULL)
GROUP BY
  obras.id,
  obras.ovnota,
  obras.pep,
  obras.diagrama,
  obras.ordem_dci,
  obras.ordem_dcim,
  obras.ordem_dcd,
  obras.ordem_dca,
  municipios.mun,
  regionais.regional,
  obras.entrada,
  obras.prazo,
  tipos.tipo_obra,
  obras.qtde_planejada,
  obras.qtde_pend,
  circuitos.circuito,
  obras.mo_planejada,
  obras.id_status,
  obras.observ_obra,
  turmas.turma,
  obras.executado,
  dp.min_data_prog,
  dp.max_data_prog,
  STATUS.status,
  obras.capex_mat_plan,
  obras.capex_mo_plan,
  obras.capex_mat_pend,
  obras.capex_mo_pend,
  obras.data_conclusao,
  dp.hora_ini,
  dp.hora_ter,
  conjuntos.conjunto,
  dp.tipo_servico,
  dp.chi,
  dp.equipe_linha_morta,
  dp.equipe_regularizacao,
  dp.equipe_linha_viva,
  dp.num_dp,
  grupos.grupo,
  obras.referencia,
  obras.data_empreitamento,
  empreendimento.empreendimento,
  relatorio_viabilidade.data_envio,
  relatorio_viabilidade.prazo_viabilidade,
  obras.ano_plan
ORDER BY
  CASE
    WHEN (dp.min_data_prog IS NULL) THEN 1
    ELSE 0
  END,
  dp.min_data_prog,
  obras.data_conclusao DESC,
  obras.entrada DESC;