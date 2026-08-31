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
  ExportFileType,
  ExportFiltersModal,
  ServicesExportFilter,
} from "./servicesExportFilter";
import { useFeedback } from "@/hooks/useFeedback";
import { DateRangerFilter } from "./dateRangerFilter";

interface ExportButtonProps {
  text: string;
  token: string | undefined;
  path: string;
  visible: boolean;
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
  filterType,
  options,
}: ExportButtonProps) {
  const { showError } = useFeedback();

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [dateRangeModal, setDateRangeModal] = useState<boolean>(false);

  const [loading, setLoading] = useState(false);

  const { permissions } = useUser();

  const generateFile = async (
    filters?: Record<string, string | number | number[] | ExportFileType>,
  ) => {
    if (!token) {
      throw new Error("Sessão expirada");
    }

    try {
      setLoading(true);

      const url = mountUrl(
        `${process.env.NEXT_PUBLIC_API_URL}/exportacao/${path}`,
        filters,
      );

      const response = await exportExcel(url, token);

      if (!response.success) {
        showError(response.message);
        return;
      }

      const downloadUrl = URL.createObjectURL(response.data);

      const link = document.createElement("a");

      link.href = downloadUrl;

      link.download = `${text}.${filters?.fileType === "pdf" ? "pdf" : "xlsx"}`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      URL.revokeObjectURL(downloadUrl);
    } finally {
      setLoading(false);
    }
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
              text="Exportar"
              onClick={() => {
                if (filterType === "none") {
                  generateFile();
                  return;
                }

                if (filterType === "services") {
                  setOpenModal(true);
                  return;
                }

                if (filterType === "dateRange") {
                  setDateRangeModal(true);
                }
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
                loading={loading}
              />
            </ExportFiltersModal>
          )}

          {filterType === "dateRange" && (
            <DateRangerFilter
              openModal={dateRangeModal}
              setOpenModal={setDateRangeModal}
              generateExcel={async ({ startDate, endDate, idPartner }) => {
                await generateFile({
                  startDate,
                  endDate,
                  idPartner,
                });
              }}
              options={options}
              loading={loading}
            />
          )}
        </>
      )}
    </>
  );
}
