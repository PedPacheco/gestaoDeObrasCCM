"use client";

import { Box, Typography } from "@mui/material";
import { ButtonComponent } from "../common/Button";
import {
  ArrowDownTrayIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/20/solid";
import { mountUrl } from "@/utils/mountUrl";
import { exportExcel } from "@/actions/generateExcel.action";
import ErrorModal from "../common/ErrorModal";
import { useState } from "react";

interface ExportButtonProps {
  text: string;
  token: string | undefined;
  path: string;
}

export function ExportButton({ text, token, path }: ExportButtonProps) {
  const [error, setError] = useState<string | null>();

  const generateExcel = async () => {
    const url = mountUrl(
      `${process.env.NEXT_PUBLIC_API_URL}/exportacao/${path}`
    );

    try {
      if (!token) {
        throw new Error("Sessão do usuário expirada");
      }

      const blob = await exportExcel(url, token);

      const downloadUrl = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = downloadUrl;
      link.download = `${text}.xlsx`;

      document.body.append(link);
      link.click();

      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error: any) {
      setError(`Erro ao gerar a planilha: ${error.message}`);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid #e2e8f0",
          py: 2,
        }}
      >
        <Typography
          sx={{
            fontWeight: 600,
            fontSize: 20,
            textTransform: "uppercase",
            paddingRight: { xs: 1, md: 8 },
          }}
        >
          {text}
        </Typography>
        <ButtonComponent
          text="Exportar"
          onClick={generateExcel}
          startIcon={<ArrowDownTrayIcon width={20} height={20} />}
          styled="min-w-48"
        />
      </Box>

      {error && (
        <ErrorModal
          open={true}
          message={error}
          onClose={() => setError(null)}
          icon={<ExclamationCircleIcon width={48} height={48} />}
        />
      )}
    </>
  );
}
