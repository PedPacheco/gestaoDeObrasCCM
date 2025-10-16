import { ButtonInsertContract } from "@/components/entryComponents/importContract/buttonInsertContract";
import { TableImportedContracts } from "@/components/entryComponents/importContract/tableImportedContracts";
import { EmotionCacheProvider } from "@/theme/emotionCache";
import { Box, Paper } from "@mui/material";

import { ButtonImportContract } from "../../../../components/entryComponents/importContract/buttonImportContract";

export const dynamic = "force-dynamic";

export default async function Contract() {
  return (
    <EmotionCacheProvider>
      <div className="my-6 w-full h-full flex flex-col">
        <div className="flex flex-col h-full items-center">
          <Paper className="p-6 mb-8 justify-start">
            <Box className="flex gap-4 flex-wrap">
              <ButtonImportContract />
              <ButtonInsertContract />
            </Box>
          </Paper>

          <TableImportedContracts />
        </div>
      </div>
    </EmotionCacheProvider>
  );
}
