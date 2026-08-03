SELECT
  o.ovnota,
  g.grupo,
  t.tipo_obra,
  s.status,
  ordens.ordemdiagrama,
  o.data_conclusao,
  r.regional,
  par.turma,
  p.data_prog
FROM
  (
    (
      (
        (
          (
            (
              (
                (
                  obras o
                  JOIN tipos t ON ((t.id = o.id_tipo))
                )
                JOIN grupos g ON ((g.id = t.id_grupo))
              )
              JOIN STATUS s ON ((s.id = o.id_status))
            )
            JOIN municipios m ON ((m.id = o.id_gpm))
          )
          JOIN regionais r ON ((r.id = m.id_regional))
        )
        JOIN turmas par ON ((par.id = o.id_turma))
      )
      LEFT JOIN (
        SELECT
          DISTINCT ON (p_1.id_obra) p_1.id_obra,
          p_1.data_prog
        FROM
          programacoes p_1
        WHERE
          (p_1.exec IS NULL)
        ORDER BY
          p_1.id_obra,
          p_1.data_prog
      ) p ON ((p.id_obra = o.id))
    )
    CROSS JOIN LATERAL (
      VALUES
        (o.diagrama),
        (o.ordem_dci),
        (o.ordem_dcim),
        (o.ordem_dcd),
        (o.ordem_dca)
    ) ordens(ordemdiagrama)
  )
WHERE
  (ordens.ordemdiagrama IS NOT NULL);