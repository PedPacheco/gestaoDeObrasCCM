SELECT
  obras.ovnota,
  row_number() OVER () AS row_id,
  sum((cn52n.preco * cn52n.qtd_necessaria)) AS mo
FROM
  (
    cn52n
    LEFT JOIN obras ON (
      (
        (
          (cn52n.diagrama_rede) :: text = (obras.ordem_dci) :: text
        )
        OR (
          (cn52n.diagrama_rede) :: text = (obras.ordem_dcd) :: text
        )
        OR (
          (cn52n.diagrama_rede) :: text = (obras.ordem_dca) :: text
        )
        OR (
          (cn52n.diagrama_rede) :: text = (obras.ordem_dcim) :: text
        )
        OR (
          (cn52n.diagrama_rede) :: text = (COALESCE(obras.diagrama)) :: text
        )
      )
    )
  )
WHERE
  (
    ((cn52n.cti) :: text = 'N' :: text)
    AND ((cn52n.und) :: text = 'SRV' :: text)
    AND ((cn52n.texto_breve) :: text !~~ '%ENTREGA%' :: text)
  )
GROUP BY
  obras.ovnota
ORDER BY
  obras.ovnota;