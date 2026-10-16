import { cookies } from "next/headers";

import { ErrorThrower } from "@/components/common/ErrorThrower";
import WorksMapWrapper from "@/components/worksMap/worksMapWrapper";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function MapaObrasPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  if (!token) {
    return <ErrorThrower message="Token não encontrado" />;
  }

  return (
    <div
      className="w-full flex-1 overflow-hidden flex flex-col"
      style={{ height: "calc(100vh - 120px)" }}
    >
      <WorksMapWrapper token={token} />
    </div>
  );
}
