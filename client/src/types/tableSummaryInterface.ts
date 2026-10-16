import { MonthlySummaryTableColumn } from "@/app/(dashboard)/(with-breadcrumbs)/programacao/resumo-mensal/page";

export interface TableSummaryInterface {
  data: MonthlySummaryTableColumn[];
  columns: any;
  totals?: any;
  isFirstSummary: boolean;
}
