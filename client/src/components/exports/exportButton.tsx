"use client";

import "dayjs/locale/pt-br";

import dayjs from "dayjs";
import { useState } from "react";

import { exportExcel } from "@/actions/generateExcel.action";
import { mountUrl } from "@/utils/mountUrl";
import {
  ArrowDownTrayIcon,
  ExclamationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/20/solid";
import { Box, IconButton, Modal, Typography } from "@mui/material";
import { DatePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";

import { ButtonComponent } from "../common/Button";
import ErrorModal from "../common/ErrorModal";
import { useUser } from "@/contexts/userContext";
import { useFeedback } from "@/hooks/useFeedback";

interface ExportButtonProps {
  text: string;
  token: string | undefined;
  path: string;
  visible: boolean;
}

export function ExportButton({
  text,
  token,
  path,
  visible,
}: ExportButtonProps) {
  const { showError } = useFeedback();
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [startDate, setStartDate] = useState<dayjs.Dayjs | null>(null);
  const [endDate, setEndDate] = useState<dayjs.Dayjs | null>(null);

  const { permissions } = useUser();

  const generateExcel = async () => {
    const params =
      startDate && endDate
        ? {
            startDate: startDate.format("YYYY-MM-DD"),
            endDate: endDate.format("YYYY-MM-DD"),
          }
        : undefined;

    const url = mountUrl(
      `${process.env.NEXT_PUBLIC_API_URL}/exportacao/${path}`,
      params,
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

      if (startDate && endDate) {
        setOpenModal(false);
        setStartDate(null);
        setEndDate(null);
      }
    } catch (error: any) {
      showError(`Erro ao gerar a planilha: ${error.message}`);
    }
  };

  return (
    <>
      {permissions?.permissao_visualizacao === "parcial" && !visible ? null : (
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
              onClick={() =>
                path === "obras-multas" ? setOpenModal(true) : generateExcel()
              }
              startIcon={<ArrowDownTrayIcon width={20} height={20} />}
              styled="min-w-48"
            />
          </Box>

          {openModal && (
            <Modal
              open={openModal}
              onClose={() => setOpenModal(!openModal)}
              aria-labelledby="confirmation-modal-title"
              aria-describedby="confirmation-modal-description"
              closeAfterTransition
            >
              <Box className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white dark:bg-gray-800 shadow-lg p-6 rounded-lg w-10/12 md:w-1/2">
                <IconButton
                  onClick={() => setOpenModal(!openModal)}
                  className="absolute top-2 right-2 text-gray-600 dark:text-gray-300"
                >
                  <XMarkIcon />
                </IconButton>

                <Typography
                  id="confirmation-modal-title"
                  variant="h6"
                  component="h2"
                  className="text-center mb-4 font-bold text-2xl"
                >
                  Selecione o período da extração
                </Typography>

                <div className="flex flex-col justify-center items-center">
                  <div className="mb-4 w-72 lg:w-96">
                    <LocalizationProvider
                      dateAdapter={AdapterDayjs}
                      adapterLocale="pt-br"
                    >
                      <DatePicker
                        views={["day"]}
                        format={"DD/MM/YYYY"}
                        value={startDate}
                        onChange={(value) =>
                          value ? setStartDate(value) : dayjs()
                        }
                        slotProps={{
                          textField: { size: "small", fullWidth: true },
                        }}
                      />
                    </LocalizationProvider>
                  </div>

                  <div className="mb-4 w-72 lg:w-96">
                    <LocalizationProvider
                      dateAdapter={AdapterDayjs}
                      adapterLocale="pt-br"
                    >
                      <DatePicker
                        views={["day"]}
                        format={"DD/MM/YYYY"}
                        value={endDate}
                        onChange={(value) =>
                          value ? setEndDate(value) : dayjs()
                        }
                        slotProps={{
                          textField: { size: "small", fullWidth: true },
                        }}
                      />
                    </LocalizationProvider>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <ButtonComponent
                    onClick={() => setOpenModal(!openModal)}
                    text="Cancelar"
                    styled=" py-2 px-4 rounded"
                  />
                  <ButtonComponent
                    onClick={generateExcel}
                    text="Confirmar"
                    styled="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded"
                  />
                </div>
              </Box>
            </Modal>
          )}
        </>
      )}
    </>
  );
}
