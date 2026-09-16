import MainReclamacoes from "@/components/reclamacoesOuvidoria/MainReclamacoes";
import { EmotionCacheProvider } from "@/theme/emotionCache";

export const dynamic = "force-dynamic";

export default function ReclamacoesOuvidoriaPage() {
  return (
    <div className="h-full w-full overflow-y-auto">
      <EmotionCacheProvider>
        <MainReclamacoes />
      </EmotionCacheProvider>
    </div>
  );
}
