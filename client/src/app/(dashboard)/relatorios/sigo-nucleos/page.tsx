import SigoNucleosDashboard from "@/components/sigoNucleos/SigoNucleosDashboard";

export const dynamic = "force-dynamic";

export default async function SigoNucleosPage() {
  return (
    <div className="h-full w-full overflow-y-auto">
      <SigoNucleosDashboard />
    </div>
  );
}
