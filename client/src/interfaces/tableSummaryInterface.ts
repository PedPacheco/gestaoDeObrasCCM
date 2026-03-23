import { MonthlySummaryTableColumn } from "@/app/(dashboard)/programacao/resumo-mensal/page";

export interface TableSummaryInterface {
  data: MonthlySummaryTableColumn[];
  columns: any;
  totals?: any;
  isFirstSummary: boolean;
}
