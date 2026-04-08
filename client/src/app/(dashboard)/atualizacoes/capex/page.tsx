import { ImportCapexButton } from "@/components/updatesComponents/updateCapex/importCapexButton";
import { UpdateCapexButton } from "@/components/updatesComponents/updateCapex/updateCapexButton";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { Box, Paper } from "@mui/material";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function CapexUpdates() {
  const cookieStore = await cookies();

  return (
    <EmotionCacheProvider>
      <div className="my-6 w-full h-full flex flex-col">
        <div className="flex flex-col h-full lg:justify-between lg:items-center">
          <Paper className="p-6 mb-8 justify-start">
            <Box className="flex gap-4 flex-wrap">
              <ImportCapexButton token={cookieStore.get("token")?.value} />
              <UpdateCapexButton />
            </Box>
          </Paper>
        </div>
      </div>
    </EmotionCacheProvider>
  );
}
