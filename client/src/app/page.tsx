import { cookies } from "next/headers";
import Image from "next/image";

import DashboardClient from "@/components/dashboard/DashboardClient";
import { Header } from "@/components/layout/Header";
import { getInitialTab, InitialDashboardData } from "@/lib/dashboard/constants";
import {
  loadGoalsFilters,
  loadLaborFilters,
  loadMaodeObra,
  loadMetasRecomposicao,
} from "@/lib/dashboard/loaders";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const API = process.env.NEXT_PUBLIC_API_URL!;
const NO_CACHE = { cache: "no-store" as const };

// ── Áreas com permissão de acesso ao dashboard ──────────────
const ALLOWED_AREAS = [1, 8];

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Função para extrair dados do utilizador dos cookies
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
interface UserInfo {
  id: number;
  username: string;
  nome_usuario: string;
  email: string;
  tipo_usuario: string; // "INTERNO" | "EXTERNO"
  is_admin: boolean;
  permissao_edicao: boolean;
  id_regional: number | null;
  id_turma: number | null;
  id_area: number | null;
}

function getUserFromCookies(
  cookieStore: Awaited<ReturnType<typeof cookies>>,
): UserInfo | null {
  const raw = cookieStore.get("userInfo")?.value;
  if (!raw) return null;

  try {
    // O cookie pode estar URL-encoded (ex: %7B...%7D)
    const decoded = decodeURIComponent(raw);
    return JSON.parse(decoded) as UserInfo;
  } catch {
    return null;
  }
}

function checkDashboardAccess(user: UserInfo | null): boolean {
  // Sem utilizador → sem acesso
  if (!user) return false;

  // EXTERNO → tem acesso
  if (user.tipo_usuario !== "INTERNO") return true;

  // INTERNO → só se estiver nas áreas permitidas
  return ALLOWED_AREAS.includes(user.id_area ?? -1);
}

/** Uma falha não derruba a página: devolve undefined e o cliente tenta de novo. */
async function settle<T>(promise: Promise<T>): Promise<T | undefined> {
  try {
    return await promise;
  } catch (error) {
    console.error("[Dashboard] Falha no carregamento inicial:", error);
    return undefined;
  }
}

async function loadInitialData(
  tab: ReturnType<typeof getInitialTab>,
  token: string,
): Promise<InitialDashboardData> {
  if (tab === "metas-recomposicao") {
    const [metas, goalsFilters] = await Promise.all([
      settle(loadMetasRecomposicao(token)),
      settle(loadGoalsFilters(token)),
    ]);
    return { metas, goalsFilters };
  }

  const [labor, laborFilters] = await Promise.all([
    settle(loadMaodeObra(token)),
    settle(loadLaborFilters()),
  ]);
  return { labor, laborFilters };
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// PAGE COMPONENT
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default async function Home() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value ?? "";

  // ✅ Ler dados do utilizador diretamente do cookie "userInfo"
  const user = getUserFromCookies(cookieStore);
  const hasDashboardAccess = checkDashboardAccess(user);

  // ✅ Se NÃO tem permissão → tela com logo (ZERO fetches)
  if (!hasDashboardAccess) {
    return (
      <div className="relative z-0 flex min-h-screen">
        <div className="flex flex-1 flex-col h-screen overflow-y-auto">
          <Header />
          <main className="flex-1 bg-[url(/fundo.png)] bg-cover bg-center bg-no-repeat">
            <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)]">
              <Image
                src="/logo-sigo.png"
                alt="Logo SIGO"
                className="
                  w-[60%] sm:w-[50%] md:w-[40%] lg:w-[30%] xl:w-[25%]
                  h-auto mr-12 mb-8 object-contain
                "
                width={740}
                height={500}
              />
            </div>
          </main>
        </div>
      </div>
    );
  }

  // ✅ Se TEM permissão → buscar dados normalmente
  const initialTab = getInitialTab(user?.id_area);
  const initialData = await loadInitialData(initialTab, token);

  return (
    <div className="relative z-0 flex min-h-screen">
      <div className="flex flex-1 flex-col h-screen overflow-y-auto transition-all duration-300 ease-in-out">
        <Header />

        <main className="flex-1">
          <DashboardClient
            token={token}
            initialTab={initialTab}
            initialData={initialData}
          />
        </main>
      </div>
    </div>
  );
}
