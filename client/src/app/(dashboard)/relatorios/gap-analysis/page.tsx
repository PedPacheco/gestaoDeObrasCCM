import { fetchFilters } from "@/actions/fetchFilters.action";
import GapAnalysis from "@/components/gapAnalysis/gapAnalysis";

export const dynamic = "force-dynamic";

const excludedPartners = [1, 6, 10, 11, 14, 15, 16];

export default async function GapAnalysisPage() {
  const filters = await fetchFilters({ parceira: true });

  const partners = filters.parceira.filter(
    (partner: { id: number; turma: string }) =>
      !excludedPartners.includes(partner.id),
  );

  return (
    <div className="h-full w-full overflow-y-auto">
      <GapAnalysis partners={partners} />
    </div>
  );
}
