import MainControleSmc from "@/components/dashboard/controleSmc/MainControleSmc";
import { EmotionCacheProvider } from "@/theme/emotionCache";

export const dynamic = "force-dynamic";

export default function ControleSmcPage() {
  return (
    <div className="h-full w-full overflow-y-auto">
      <EmotionCacheProvider>
        <MainControleSmc />
      </EmotionCacheProvider>
    </div>
  );
}
