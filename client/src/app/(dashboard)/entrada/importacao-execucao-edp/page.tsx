import MainEdpExecution from "@/components/entryComponents/edpExecution/MainEdpExecution";
import { EmotionCacheProvider } from "@/theme/emotionCache";

export const dynamic = "force-dynamic";

export default async function ImportEdpExecution() {
  return (
    <EmotionCacheProvider>
      <MainEdpExecution />
    </EmotionCacheProvider>
  );
}
