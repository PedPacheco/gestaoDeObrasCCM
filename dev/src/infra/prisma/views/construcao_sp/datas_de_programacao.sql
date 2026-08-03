SELECT
  o.id,
  o.ovnota,
  min(p.data_prog) AS min_data_prog,
  max(p.data_prog) AS max_data_prog,
  p.exec,
  CASE
    WHEN (o.diagrama IS NULL) THEN COALESCE(o.ordem_dci, o.ordem_dcim)
    ELSE o.diagrama
  END AS ordem_diagrama,
  sub.hora_ini,
  sub.hora_ter,
  sub.equipe_linha_morta,
  sub.equipe_linha_viva,
  sub.equipe_regularizacao,
  sub.num_dp,
  sub.tipo_servico,
  sub.chi,
  sub.tecnico,
  sub.equip_desligado
FROM
  (
    (
      obras o
      JOIN (
        SELECT
          p1.id_obra,
          p1.hora_ini,
          p1.hora_ter,
          p1.equipe_linha_morta,
          p1.equipe_linha_viva,
          p1.equipe_regularizacao,
          p1.num_dp,
          p1.tipo_servico,
          p1.chi,
          t.tecnico,
          p1.equip_desligado
        FROM
          (
            programacoes p1
            JOIN tecnicos t ON ((t.id = p1.id_tecnico))
          )
        WHERE
          (
            (p1.exec IS NULL)
            AND (
              p1.data_prog = (
                SELECT
                  min(p2.data_prog) AS min
                FROM
                  programacoes p2
                WHERE
                  (
                    (p2.id_obra = p1.id_obra)
                    AND (p2.exec IS NULL)
                  )
              )
            )
          )
      ) sub ON ((o.id = sub.id_obra))
    )
    JOIN programacoes p ON ((o.id = p.id_obra))
  )
WHERE
  (p.exec IS NULL)
GROUP BY
  o.id,
  o.ovnota,
  p.exec,
  CASE
    WHEN (o.diagrama IS NULL) THEN COALESCE(o.ordem_dci, o.ordem_dcim)
    ELSE o.diagrama
  END,
  sub.hora_ini,
  sub.hora_ter,
  sub.equipe_linha_morta,
  sub.equipe_linha_viva,
  sub.equipe_regularizacao,
  sub.num_dp,
  sub.tipo_servico,
  sub.chi,
  sub.tecnico,
  sub.equip_desligado;