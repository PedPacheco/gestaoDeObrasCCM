SELECT
  base_auxiliar_nota_cn52n.diagrama_rede,
  sum(
    (
      base_auxiliar_nota_cn52n.qtd_necess / (conversao.fator) :: double precision
    )
  ) AS qtde_calc,
  sum(
    CASE
      WHEN (
        (
          (base_auxiliar_nota_cn52n.ctg_item) :: text = 'N' :: text
        )
        AND (
          (base_auxiliar_nota_cn52n.um_registro) :: text = 'SRV' :: text
        )
        AND (
          "position"(
            (base_auxiliar_nota_cn52n.texto_material) :: text,
            'ENTREGA' :: text
          ) = 0
        )
      ) THEN (
        base_auxiliar_nota_cn52n.preco_mi * base_auxiliar_nota_cn52n.qtd_necess
      )
      ELSE (0) :: double precision
    END
  ) AS mo_calc,
  sum(
    CASE
      WHEN (
        (base_auxiliar_nota_cn52n.ctg_item) :: text = 'L' :: text
      ) THEN (
        base_auxiliar_nota_cn52n.qtd_necess * base_auxiliar_nota_cn52n.preco_mi
      )
      ELSE (0) :: double precision
    END
  ) AS capex_mat_calc
FROM
  (
    base_auxiliar_nota_cn52n
    LEFT JOIN conversao ON (
      (
        (
          (conversao.material) :: text = (base_auxiliar_nota_cn52n.material) :: text
        )
        AND (
          (base_auxiliar_nota_cn52n.def_proj) :: text = (conversao.pep_ref) :: text
        )
      )
    )
  )
GROUP BY
  base_auxiliar_nota_cn52n.diagrama_rede
ORDER BY
  base_auxiliar_nota_cn52n.diagrama_rede;