WITH rankedprogramacoes AS (
  SELECT
    obras.id,
    obras.ovnota,
    programacoes.data_prog,
    programacoes.hora_ini,
    programacoes.hora_ter,
    programacoes.tipo_servico,
    programacoes.equipe_linha_morta,
    programacoes.equipe_linha_viva,
    programacoes.equipe_regularizacao,
    programacoes.chi,
    programacoes.id_tecnico,
    COALESCE(
      obras.diagrama,
      COALESCE(obras.ordem_dci, obras.ordem_dcim)
    ) AS ordemdiagrama,
    row_number() OVER (
      PARTITION BY obras.ovnota
      ORDER BY
        programacoes.data_prog,
        programacoes.hora_ini
    ) AS rn,
    row_number() OVER (
      PARTITION BY obras.ovnota
      ORDER BY
        programacoes.data_prog DESC,
        programacoes.hora_ini DESC
    ) AS rn_desc
  FROM
    (
      obras
      JOIN programacoes ON ((obras.id = programacoes.id_obra))
    )
  WHERE
    (programacoes.exec IS NULL)
),
first_last_programacoes AS (
  SELECT
    rankedprogramacoes.ovnota,
    max(
      CASE
        WHEN (rankedprogramacoes.rn = 1) THEN rankedprogramacoes.data_prog
        ELSE NULL :: date
      END
    ) AS first_data_prog,
    max(
      CASE
        WHEN (rankedprogramacoes.rn_desc = 1) THEN rankedprogramacoes.data_prog
        ELSE NULL :: date
      END
    ) AS last_data_prog
  FROM
    rankedprogramacoes
  GROUP BY
    rankedprogramacoes.ovnota
)
SELECT
  rp.id,
  rp.ovnota,
  flp.first_data_prog,
  flp.last_data_prog,
  rp.hora_ini,
  rp.hora_ter,
  rp.tipo_servico,
  rp.equipe_linha_morta,
  rp.equipe_linha_viva,
  rp.equipe_regularizacao,
  rp.id_tecnico,
  rp.chi,
  rp.ordemdiagrama
FROM
  (
    rankedprogramacoes rp
    JOIN first_last_programacoes flp ON (((rp.ovnota) :: text = (flp.ovnota) :: text))
  )
WHERE
  (rp.rn = 1)
ORDER BY
  rp.ovnota,
  rp.rn;