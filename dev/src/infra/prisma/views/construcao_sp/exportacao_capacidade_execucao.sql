SELECT
  row_number() OVER () AS id,
  capacidade_execucao.ano,
  regionais.regional,
  turmas.turma,
  sum(capacidade_execucao.should_cost) AS total_shouldcost,
  sum(capacidade_execucao.qtd_equipes_rfp) AS total_qtde_equipes_rfp,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao.jan) :: double precision
    )
  ) AS financeiro_jan,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao.fev) :: double precision
    )
  ) AS financeiro_fev,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao.mar) :: double precision
    )
  ) AS financeiro_mar,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao.abr) :: double precision
    )
  ) AS financeiro_abr,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao.mai) :: double precision
    )
  ) AS financeiro_mai,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao.jun) :: double precision
    )
  ) AS financeiro_jun,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao.jul) :: double precision
    )
  ) AS financeiro_jul,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao.ago) :: double precision
    )
  ) AS financeiro_ago,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao.set) :: double precision
    )
  ) AS financeiro_set,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao."out") :: double precision
    )
  ) AS financeiro_out,
  sum(
    (
      capacidade_execucao.should_cost * (capacidade_execucao.nov) :: double precision
    )
  ) AS financeiro_nov,
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
  turmas.turma;