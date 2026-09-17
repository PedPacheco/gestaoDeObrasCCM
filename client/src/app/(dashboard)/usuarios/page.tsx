import { fetchData } from "@/actions/fetchData.action";
import { fetchFilters } from "@/actions/fetchFilters.action";
import { AdminUsersMain } from "@/components/adminUsers/adminUsersMain";
import { EmotionCacheProvider } from "@/theme/emotionCache";
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
    <EmotionCacheProvider>
      <div className="flex w-full flex-col items-center pt-4">
        <AdminUsersMain initialUsers={usersData.data} filters={filters} />
      </div>
    </EmotionCacheProvider>
  );
}
