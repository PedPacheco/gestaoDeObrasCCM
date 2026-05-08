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
  municipios.municipio,
  regionais.regional,
  obras.data_conclusao,
  turmas.turma AS parceira,
  obras.mo_planejada,
  obras.referencia,
  programacoes.data_prog,
  programacoes.hora_ini,
  programacoes.hora_ter,
  programacoes.prog,
  programacoes.exec,
  programacoes.tipo_servico,
  programacoes.num_dp,
  programacoes.chi,
  programacoes.chave_provisoria,
  programacoes.equipe_linha_morta,
  programacoes.equipe_linha_viva,
  programacoes.equipe_regularizacao,
  programacoes.equip_desligado,
  restricoes.restricao AS restricao_execucao,
  programacoes.nome_responsavel_execucao AS nome_do_responsavel_execucao,
  restricoes_1.restricao AS restricao_programacao,
  programacoes.responsabilidade1 AS responsabilidade,
  programacoes.nome_responsavel AS nome_do_responsavel,
  programacoes.area_responsavel1 AS area_responsavel,
  programacoes.status_restricao1 AS status_restricao,
  programacoes.data_resolucao1 AS data_resolucao,
  STATUS.status,
  tipos.tipo_obra,
  grupos.grupo,
  circuitos.circuito,
  obras.capex_mo_plan,
  restricoes_2.restricao AS restricao_programacao2,
  programacoes.responsabilidade2,
  programacoes.nome_responsavel2,
  programacoes.area_responsavel2,
  programacoes.status_restricao2,
  programacoes.data_resolucao2,
  programacoes.observacao_restricao,
  programacoes.observacao_execucao,
  status_programacao.status_programacao,
  programacoes.observacao_programacao
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
                        (
                          programacoes
                          LEFT JOIN restricoes ON (
                            (
                              restricoes.id = programacoes.id_restricao_execucao
                            )
                          )
                        )
                        LEFT JOIN status_programacao ON (
                          (
                            status_programacao.id = programacoes.id_status_programacao
                          )
                        )
                      )
                      LEFT JOIN restricoes restricoes_1 ON (
                        (
                          programacoes.id_restricao_prog1 = restricoes_1.id
                        )
                      )
                    )
                    LEFT JOIN restricoes restricoes_2 ON (
                      (
                        programacoes.id_restricao_prog2 = restricoes_2.id
                      )
                    )
                  )
                  JOIN obras ON ((obras.id = programacoes.id_obra))
                )
                JOIN STATUS ON ((STATUS.id = obras.id_status))
              )
              JOIN tipos ON ((tipos.id = obras.id_tipo))
            )
            JOIN grupos ON ((grupos.id = tipos.id_grupo))
          )
          JOIN circuitos ON ((circuitos.id = obras.id_circuito))
        )
        JOIN municipios ON ((municipios.id = obras.id_gpm))
      )
      JOIN regionais ON ((regionais.id = municipios.id_regional))
    )
    JOIN turmas ON ((turmas.id = obras.id_turma))
  );