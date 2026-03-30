SELECT
  o.ovnota,
  g.grupo,
  t.tipo_obra,
  s.status,
  ordens.ordemdiagrama
FROM
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