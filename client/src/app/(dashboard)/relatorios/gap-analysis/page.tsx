import AcompanhamentoPlanoDeAcaoDashboard from "@/components/dashboard/acompanhamentoPlanoDeAcao/AcompanhamentoPlanoDeAcaoDashboard";

export const dynamic = "force-dynamic";

export default function GapAnalysisPage() {
  return (
    <div className="h-full w-full overflow-y-auto">
      <AcompanhamentoPlanoDeAcaoDashboard />
    </div>
  );
}
