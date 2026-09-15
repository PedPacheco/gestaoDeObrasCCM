import SigoNucleosDashboard from "@/components/dashboard/sigoNucleos/SigoNucleosDashboard";

export const dynamic = "force-dynamic";

export default function SigoNucleosPage() {
  return (
    <div className="h-full w-full overflow-y-auto">
      <SigoNucleosDashboard />
    </div>
  );
}
