import { ServicesPageComponent } from "@/components/servicesPage";

export default async function ServicosPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return <ServicesPageComponent />;
}
