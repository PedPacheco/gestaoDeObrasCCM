import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { AdminUsersMain } from "@/components/adminUsers/adminUsersMain";
import { cookies } from "next/headers";

export default async function AdministrarLoginPage() {
  const cookieStore = await cookies();

  const token = cookieStore.get("token")?.value;

  const [filters, usersData] = await Promise.all([
    fetchFilters({
      regional: true,
      parceira: true,
    }),
    fetchData(`${process.env.NEXT_PUBLIC_API_URL}/user`, undefined, token),
  ]);

  return (
    <div className="flex flex-col w-4/5 py-6 gap-4">
      <h1 className="text-2xl font-bold">Controle de Usuários</h1>

      <AdminUsersMain initialUsers={usersData.data} filters={filters} />
    </div>
  );
}
