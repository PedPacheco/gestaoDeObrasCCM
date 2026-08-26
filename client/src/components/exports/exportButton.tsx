"use client";

import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import { useState } from "react";

import { exportExcel } from "@/actions/generateExcel.action";
import { useUser } from "@/contexts/userContext";
import { mountUrl } from "@/utils/mountUrl";
import { Box, Typography } from "@mui/material";

import { ButtonComponent } from "../common/Button";
import {
  ExportFiltersModal,
  ServicesExportFilter,
} from "./servicesExportFilter";

export type ExportFileType = "excel" | "pdf";

interface ExportButtonProps {
  text: string;
  token: string | undefined;
  path: string;
  visible: boolean;
  type?: ExportFileType;
  options: {
    parceira: Array<{ id: number; turma: string }>;
    equipes: Array<{ id: number; equipe: string; id_turma: number }>;
  };
  filterType?: "none" | "dateRange" | "services";
}

export function ExportButton({
  text,
  token,
  path,
  visible,
  type,
  filterType,
  options,
}: ExportButtonProps) {
  const [openModal, setOpenModal] = useState<boolean>(false);

  const { permissions } = useUser();

  const generateFile = async (
    filters?: Record<string, string | number | number[]>,
  ) => {
    if (!token) {
      throw new Error("Sessão expirada");
    }

    const url = mountUrl(
      `${process.env.NEXT_PUBLIC_API_URL}/exportacao/${path}`,
      filters,
    );

    const blob = await exportExcel(url, token);

    const downloadUrl = URL.createObjectURL(blob);

    const link = document.createElement("a");

    link.href = downloadUrl;

    console.log(type);

    link.download = `${text}.${type === "pdf" ? "pdf" : "xlsx"}`;

    document.body.appendChild(link);

    link.click();

    link.remove();

    URL.revokeObjectURL(downloadUrl);
  };

  return (
    <>
      {permissions?.tipo_usuario === "PARCEIRA" && !visible ? null : (
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
                fontSize: 18,
                textTransform: "uppercase",
                paddingRight: { xs: 1, md: 8 },
              }}
            >
              {text}
            </Typography>
            <ButtonComponent
              text={type === "pdf" ? "Exportar PDF" : "Exportar"}
              onClick={() => {
                if (filterType === "none") {
                  generateFile();
                  return;
                }

                setOpenModal(true);
              }}
            />
          </Box>
          {filterType === "services" && (
            <ExportFiltersModal
              open={openModal}
              onClose={() => setOpenModal(false)}
            >
              <ServicesExportFilter
                onConfirm={async (filters) => {
                  await generateFile(filters);

                  setOpenModal(false);
                }}
                options={options}
              />
            </ExportFiltersModal>
          )}
        </>
      )}
    </>
  );
}
