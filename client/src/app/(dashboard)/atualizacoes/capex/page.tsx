import { UpdateCapexButton } from "@/components/updatesComponents/updateCapexButton";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { Box, Paper } from "@mui/material";

export const dynamic = "force-dynamic";

export default async function CapexUpdates() {
  return (
    <EmotionCacheProvider>
      <div className="my-6 w-full h-full flex flex-col">
        <div className="flex flex-col h-full lg:justify-between lg:items-center">
          <Paper className="p-6 mb-8 justify-start">
            <Box className="flex gap-4 flex-wrap">
              <UpdateCapexButton />
            </Box>
          </Paper>
        </div>
      </div>
    </EmotionCacheProvider>
  );
}
