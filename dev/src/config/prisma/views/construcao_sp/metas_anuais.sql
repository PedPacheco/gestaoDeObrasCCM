WITH maxdataprog AS (
  SELECT
    obras.id,
    max(programacoes.data_prog) AS maxdataprog
  FROM
    (
      obras
      JOIN programacoes ON ((programacoes.id_obra = obras.id))
    )
  WHERE
    (programacoes.exec IS NULL)
  GROUP BY
    obras.id
)
SELECT
  row_number() OVER () AS unique_id,
  obras.id_tipo,
  obras.id_turma,
  municipios.id_regional,
  CASE
    WHEN (obras.data_conclusao IS NOT NULL) THEN date_part('year' :: text, obras.data_conclusao)
    WHEN (maxdataprog.maxdataprog IS NOT NULL) THEN date_part('year' :: text, maxdataprog.maxdataprog)
    ELSE date_part('year' :: text, CURRENT_DATE)
  END AS anocalc,
  sum(0) AS janfismeta,
  sum(0) AS fevfismeta,
  sum(0) AS marfismeta,
  sum(0) AS abrfismeta,
  sum(0) AS maifismeta,
  sum(0) AS junfismeta,
  sum(0) AS julfismeta,
  sum(0) AS agofismeta,
  sum(0) AS setfismeta,
  sum(0) AS outfismeta,
  sum(0) AS novfismeta,
  sum(0) AS dezfismeta,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, maxdataprog.maxdataprog) = (1) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS janfisprog,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, maxdataprog.maxdataprog) = (2) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS fevfisprog,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, maxdataprog.maxdataprog) = (3) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS marfisprog,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, maxdataprog.maxdataprog) = (4) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS abrfisprog,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, maxdataprog.maxdataprog) = (5) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS maifisprog,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, maxdataprog.maxdataprog) = (6) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS junfisprog,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, maxdataprog.maxdataprog) = (7) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS julfisprog,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, maxdataprog.maxdataprog) = (8) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS agofisprog,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, maxdataprog.maxdataprog) = (9) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS setfisprog,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, maxdataprog.maxdataprog) = (10) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS outfisprog,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, maxdataprog.maxdataprog) = (11) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS novfisprog,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, maxdataprog.maxdataprog) = (12) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS dezfisprog,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, obras.data_conclusao) = (1) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS janfisreal,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, obras.data_conclusao) = (2) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS fevfisreal,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, obras.data_conclusao) = (3) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS marfisreal,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, obras.data_conclusao) = (4) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS abrfisreal,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, obras.data_conclusao) = (5) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS maifisreal,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, obras.data_conclusao) = (6) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS junfisreal,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, obras.data_conclusao) = (7) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS julfisreal,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, obras.data_conclusao) = (8) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS agofisreal,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, obras.data_conclusao) = (9) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS setfisreal,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, obras.data_conclusao) = (10) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS outfisreal,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, obras.data_conclusao) = (11) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS novfisreal,
  sum(
    CASE
      WHEN (
        date_part('month' :: text, obras.data_conclusao) = (12) :: double precision
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS dezfisreal,
  sum(
    CASE
      WHEN (
        (maxdataprog.maxdataprog IS NULL)
        AND (obras.data_conclusao IS NULL)
        AND (obras.id_status <> 4)
      ) THEN obras.qtde_planejada
      ELSE (0) :: double precision
    END
  ) AS carteira
FROM
  (
    (
      (
        obras
        JOIN municipios ON ((municipios.id = obras.id_gpm))
      )
      JOIN tipos ON ((tipos.id = obras.id_tipo))
    )
    LEFT JOIN maxdataprog ON ((obras.id = maxdataprog.id))
  )
WHERE
  (tipos.id_grupo = 2) AND obras.id_status <> 3
GROUP BY
  obras.id_tipo,
  obras.id_turma,
  municipios.id_regional,
  CASE
    WHEN (obras.data_conclusao IS NOT NULL) THEN date_part('year' :: text, obras.data_conclusao)
    WHEN (maxdataprog.maxdataprog IS NOT NULL) THEN date_part('year' :: text, maxdataprog.maxdataprog)
    ELSE date_part('year' :: text, CURRENT_DATE)
  END,
  tipos.id_grupo
UNION
ALL
SELECT
  row_number() OVER () AS unique_id,
  metas.id_tipo,
  metas.id_turma,
  metas.id_regional,
  metas.ano_metas AS anocalc,
  metas.jan_meta_fisico AS janfismeta,
  metas.fev_meta_fisico AS fevfismeta,
  metas.mar_meta_fisico AS marfismeta,
  metas.abr_meta_fisico AS abrfismeta,
  metas.mai_meta_fisico AS maifismeta,
  metas.jun_meta_fisico AS junfismeta,
  metas.jul_meta_fisico AS julfismeta,
  metas.ago_meta_fisico AS agofismeta,
  metas.set_meta_fisico AS setfismeta,
  metas.out_meta_fisico AS outfismeta,
  metas.nov_meta_fisico AS novfismeta,
  metas.dez_meta_fisico AS dezfismeta,
  0 AS janfisprog,
  0 AS fevfisprog,
  0 AS marfisprog,
  0 AS abrfisprog,
  0 AS maifisprog,
  0 AS junfisprog,
  0 AS julfisprog,
  0 AS agofisprog,
  0 AS setfisprog,
  0 AS outfisprog,
  0 AS novfisprog,
  0 AS dezfisprog,
  0 AS janfisreal,
  0 AS fevfisreal,
  0 AS marfisreal,
  0 AS abrfisreal,
  0 AS maifisreal,
  0 AS junfisreal,
  0 AS julfisreal,
  0 AS agofisreal,
  0 AS setfisreal,
  0 AS outfisreal,
  0 AS novfisreal,
  0 AS dezfisreal,
  0 AS carteira
FROM
  metas
ORDER BY
  2,
  3,
  4;