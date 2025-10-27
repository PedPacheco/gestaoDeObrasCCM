import { DeleteSuspensionsButton } from "@/components/updatesComponents/updateSuspensions/deleteWorkSuspensions";
import { ImportSuspensionsButton } from "@/components/updatesComponents/updateSuspensions/importSuspensionsButton";
import { SuspensionImportTable } from "@/components/updatesComponents/updateSuspensions/suspensionImportTable";
import { UpdateSuspensionsButton } from "@/components/updatesComponents/updateSuspensions/updateSuspensionsButton";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { Box, Paper } from "@mui/material";

export const dynamic = "force-dynamic";

export default async function SuspensionUpdates() {
  return (
    <EmotionCacheProvider>
      <div className="my-6 w-full h-full flex flex-col">
        <div className="flex flex-col h-full lg:justify-between lg:items-center">
          <Paper className="p-6 mb-8 justify-start">
            <Box className="flex gap-4 flex-wrap items-center justify-center">
              <ImportSuspensionsButton />
              <DeleteSuspensionsButton />
              <UpdateSuspensionsButton />
            </Box>
          </Paper>

          <SuspensionImportTable />
        </div>
      </div>
    </EmotionCacheProvider>
  );
}
