import { UpdateContractButton } from "@/components/updatesComponents/updateContract/updateContractButton";
import { ImportTableContracts } from "@/components/updatesComponents/updateContract/importTableContracts";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { Box, Paper } from "@mui/material";

import { ImportContractButton } from "../../../../components/updatesComponents/updateContract/importContractButton";

export const dynamic = "force-dynamic";

export default async function Contract() {
  return (
    <EmotionCacheProvider>
      <div className="my-6 w-full h-full flex flex-col">
        <div className="flex flex-col h-full items-center">
          <Paper className="p-6 mb-8 justify-start">
            <Box className="flex gap-4 flex-wrap">
              <ImportContractButton />
              <UpdateContractButton />
            </Box>
          </Paper>

          <ImportTableContracts />
        </div>
      </div>
    </EmotionCacheProvider>
  );
}
