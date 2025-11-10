SELECT
  row_number() OVER () AS id,
  capacidade_execucao.ano,
  regionais.regional,
  turmas.turma,
  sum(capacidade_execucao.should_cost) AS total_shouldcost,
  sum(capacidade_execucao.qtd_equipes_rfp) AS total_qtde_equipes_rfp,
  capacidade_execucao.jan,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao.jan) :: double precision
    )
  ) AS financeiro_jan,
  capacidade_execucao.fev,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao.fev) :: double precision
    )
  ) AS financeiro_fev,
  capacidade_execucao.mar,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao.mar) :: double precision
    )
  ) AS financeiro_mar,
  capacidade_execucao.abr,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao.abr) :: double precision
    )
  ) AS financeiro_abr,
  capacidade_execucao.mai,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao.mai) :: double precision
    )
  ) AS financeiro_mai,
  capacidade_execucao.jun,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao.jun) :: double precision
    )
  ) AS financeiro_jun,
  capacidade_execucao.jul,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao.jul) :: double precision
    )
  ) AS financeiro_jul,
  capacidade_execucao.ago,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao.ago) :: double precision
    )
  ) AS financeiro_ago,
  capacidade_execucao.set,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao.set) :: double precision
    )
  ) AS financeiro_set,
  capacidade_execucao."out",
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao."out") :: double precision
    )
  ) AS financeiro_out,
  capacidade_execucao.nov,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao.nov) :: double precision
    )
  ) AS financeiro_nov,
  capacidade_execucao.dez,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao.dez) :: double precision
    )
  ) AS financeiro_dez
FROM
  (
    (
      capacidade_execucao
      JOIN regionais ON ((regionais.id = capacidade_execucao.id_regional))
    )
    JOIN turmas ON ((turmas.id = capacidade_execucao.id_turma))
  )
GROUP BY
  capacidade_execucao.ano,
  regionais.regional,
  turmas.turma,
  capacidade_execucao.jan,
  capacidade_execucao.fev,
  capacidade_execucao.mar,
  capacidade_execucao.abr,
  capacidade_execucao.mai,
  capacidade_execucao.jun,
  capacidade_execucao.jul,
  capacidade_execucao.ago,
  capacidade_execucao.set,
  capacidade_execucao."out",
  capacidade_execucao.nov,
  capacidade_execucao.dez;