SELECT
  row_number() OVER (
    ORDER BY
      programacoes.id
  ) AS row_id,
  obras.ovnota,
  obras.diagrama,
  obras.ordem_dci,
  obras.ordem_dcd,
  obras.ordem_dca,
  obras.ordem_dcim,
  municipios.municipio,
  regionais.regional,
  conjuntos.conjunto,
  circuitos.circuito,
  (obras.entrada + obras.prazo) AS prazo_fim,
  obras.status_ov_sap,
  tipos.tipo_obra,
  grupos.grupo,
  obras.qtde_planejada,
  obras.qtde_pend,
  (
    (
      (obras.qtde_planejada) :: integer * programacoes.prog
    ) / 100
  ) AS qtde_prog,
  obras.mo_planejada,
  (
    (
      (obras.mo_planejada) :: integer * programacoes.prog
    ) / 100
  ) AS mo_prog,
  obras.capex_mat_plan,
  obras.capex_mat_pend,
  (
    (
      (obras.capex_mat_plan) :: integer * programacoes.prog
    ) / 100
  ) AS mat_prog,
  obras.capex_mo_plan,
  obras.capex_mo_pend,
  (
    (
      (obras.capex_mo_plan) :: integer * programacoes.prog
    ) / 100
  ) AS servico_prog,
  turmas.turma AS parceira,
  obras.executado,
  STATUS.status,
  status_programacao.status_programacao,
  programacoes.criado_em,
  usuario.nome_usuario AS usuario_criador,
  usuario2.nome_usuario AS usuario_ultima_atualizacao,
  programacoes.reprovada,
  programacoes.validada,
  programacoes.confirmada,
  programacoes.data_prog,
  programacoes.prog,
  programacoes.exec,
  programacoes.chi,
  programacoes.chave_provisoria,
  programacoes.num_dp,
  programacoes.hora_ini,
  programacoes.hora_ter,
  programacoes.equipe_linha_morta,
  programacoes.equipe_linha_viva,
  programacoes.equipe_regularizacao,
  tecnicos.tecnico,
  restricoes.restricao AS restricao_execucao,
  programacoes.nome_responsavel_execucao,
  tipos.id_grupo
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
                          (
                            (
                              programacoes
                              JOIN restricoes ON (
                                (
                                  restricoes.id = programacoes.id_restricao_execucao
                                )
                              )
                            )
                            JOIN status_programacao ON (
                              (
                                status_programacao.id = programacoes.id_status_programacao
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
                JOIN conjuntos ON ((conjuntos.id = circuitos.id_conjunto))
              )
              JOIN municipios ON ((municipios.id = obras.id_gpm))
            )
            JOIN regionais ON ((regionais.id = municipios.id_regional))
          )
          JOIN turmas ON ((turmas.id = obras.id_turma))
        )
        JOIN usuario ON ((usuario.id = programacoes.id_usuario))
      )
      JOIN usuario usuario2 ON (
        (
          usuario2.id = programacoes.id_usuario_ultima_atualizacao
        )
      )
    )
    JOIN tecnicos ON ((tecnicos.id = programacoes.id_tecnico))
  );