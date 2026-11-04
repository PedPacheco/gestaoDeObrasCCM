 WITH equipes_servicos AS (
         SELECT ps.id_programacao,
            count(DISTINCT ps.id_equipe) FILTER (WHERE t.tipo = 'LM'::text) AS equipe_linha_morta,
            count(DISTINCT ps.id_equipe) FILTER (WHERE t.tipo = 'LV'::text) AS equipe_linha_viva,
            count(DISTINCT ps.id_equipe) FILTER (WHERE t.tipo = 'NR'::text) AS equipe_regularizacao
           FROM construcao_sp.programacoes_servicos ps
             JOIN construcao_sp.equipes e ON e.id = ps.id_equipe
             CROSS JOIN LATERAL ( SELECT
                        CASE
                            WHEN upper(e.equipe::text) ~~ '%LM%'::text THEN 'LM'::text
                            WHEN upper(e.equipe::text) ~~ '%LV%'::text THEN 'LV'::text
                            WHEN upper(e.equipe::text) ~~ '%NR%'::text THEN 'NR'::text
                            ELSE NULL::text
                        END AS tipo) t
          GROUP BY ps.id_programacao
        )
 SELECT row_number() OVER (ORDER BY programacoes.id) AS id,
    obras.ovnota,
    obras.pep,
        CASE
            WHEN obras.diagrama IS NULL THEN COALESCE(obras.ordem_dci, obras.ordem_dcim)
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
        CASE
            WHEN obras.programacao_ponto_a_ponto THEN COALESCE(es.equipe_linha_morta, 0::bigint)
            ELSE programacoes.equipe_linha_morta::bigint
        END::integer AS equipe_linha_morta,
        CASE
            WHEN obras.programacao_ponto_a_ponto THEN COALESCE(es.equipe_linha_viva, 0::bigint)
            ELSE programacoes.equipe_linha_viva::bigint
        END::integer AS equipe_linha_viva,
        CASE
            WHEN obras.programacao_ponto_a_ponto THEN COALESCE(es.equipe_regularizacao, 0::bigint)
            ELSE programacoes.equipe_regularizacao::bigint
        END::integer AS equipe_regularizacao,
    programacoes.equip_desligado,
    restricoes.restricao AS restricao_execucao,
    programacoes.nome_responsavel_execucao AS nome_do_responsavel_execucao,
    restricoes_1.restricao AS restricao_programacao,
    programacoes.responsabilidade1 AS responsabilidade,
    programacoes.nome_responsavel AS nome_do_responsavel,
    programacoes.area_responsavel1 AS area_responsavel,
    programacoes.status_restricao1 AS status_restricao,
    programacoes.data_resolucao1 AS data_resolucao,
    status.status,
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
    programacoes.observacao_programacao,
    programacoes.id_obra
   FROM programacoes
     JOIN restricoes ON restricoes.id = programacoes.id_restricao_execucao
     JOIN status_programacao ON status_programacao.id = programacoes.id_status_programacao
     JOIN restricoes restricoes_1 ON programacoes.id_restricao_prog1 = restricoes_1.id
     JOIN restricoes restricoes_2 ON programacoes.id_restricao_prog2 = restricoes_2.id
     JOIN obras ON obras.id = programacoes.id_obra
     JOIN status ON status.id = obras.id_status
     JOIN tipos ON tipos.id = obras.id_tipo
     JOIN grupos ON grupos.id = tipos.id_grupo
     JOIN circuitos ON circuitos.id = obras.id_circuito
     JOIN municipios ON municipios.id = obras.id_gpm
     JOIN regionais ON regionais.id = municipios.id_regional
     JOIN turmas ON turmas.id = obras.id_turma
     LEFT JOIN equipes_servicos es ON es.id_programacao = programacoes.id;