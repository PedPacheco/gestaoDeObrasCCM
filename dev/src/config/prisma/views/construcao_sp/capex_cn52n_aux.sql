SELECT
  row_number() OVER () AS row_id,
  cn52n.diagrama_rede,
  sum(
    CASE
      WHEN ((cn52n.cti) :: text = 'L' :: text) THEN (cn52n.preco * cn52n.qtd_necessaria)
      ELSE (0) :: double precision
    END
  ) AS calc1,
  sum(
    CASE
      WHEN (
        ((cn52n.cti) :: text = 'N' :: text)
        AND ((cn52n.texto_breve) :: text !~~ '%MOCP%' :: text)
        AND ((cn52n.texto_breve) :: text !~~ '%MOCF%' :: text)
        AND ((cn52n.texto_breve) :: text !~~ '%MOC%' :: text)
        AND ((cn52n.texto_breve) :: text !~~ '%MOT%' :: text)
        AND ((cn52n.texto_breve) :: text !~~ '%ENTREGA%' :: text)
        AND (
          (cn52n.texto_breve) :: text !~~ '%GERENCIAMENTO%' :: text
        )
      ) THEN (cn52n.preco * cn52n.qtd_necessaria)
      ELSE (0) :: double precision
    END
  ) AS calc2,
  sum(
    CASE
      WHEN (
        ((cn52n.cti) :: text = 'L' :: text)
        AND (cn52n.reserva IS NOT NULL)
      ) THEN (
        cn52n.preco * CASE
          WHEN (cn52n.qtd_necessaria <= cn52n.qtd_retirada) THEN (0) :: double precision
          ELSE (cn52n.qtd_necessaria - cn52n.qtd_retirada)
        END
      )
      ELSE (0) :: double precision
    END
  ) AS calc3,
  sum(
    CASE
      WHEN (
        (cn52n.reserva IS NOT NULL)
        AND ((cn52n.cti) :: text = 'N' :: text)
        AND ((cn52n.texto_breve) :: text !~~ '%MOCP%' :: text)
        AND ((cn52n.texto_breve) :: text !~~ '%MOCF%' :: text)
        AND ((cn52n.texto_breve) :: text !~~ '%MOC%' :: text)
        AND ((cn52n.texto_breve) :: text !~~ '%MOT%' :: text)
        AND ((cn52n.texto_breve) :: text !~~ '%ENTREGA%' :: text)
        AND (
          (cn52n.texto_breve) :: text !~~ '%GERENCIAMENTO%' :: text
        )
      ) THEN (
        cn52n.preco * CASE
          WHEN (cn52n.qtd_necessaria <= cn52n.qtd_entrada) THEN (0) :: double precision
          ELSE (cn52n.qtd_necessaria - cn52n.qtd_entrada)
        END
      )
      ELSE (0) :: double precision
    END
  ) AS calc4,
  sum(cn52n.qtd_manut_pend) AS soma_qtde_manut_pend
FROM
  cn52n
GROUP BY
  cn52n.diagrama_rede
ORDER BY
  cn52n.diagrama_rede;