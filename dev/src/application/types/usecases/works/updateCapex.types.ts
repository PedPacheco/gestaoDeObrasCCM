export type MaterialFactorReference = {
  material: string;
  pep_ref: string;
};

export type DeletedMaterial = {
  material: string | null;
};

export type CalculatedValue = {
  id: number;
  qtde_calc: number;
  qtde_pend: number;
  mo_calc: number;
  mo_exec: number;
  mo_pend: number;
  capex_mo_plan: number;
  capex_mat_plan: number;
  capex_mo_pend: number;
  capex_mat_pend: number;
};
