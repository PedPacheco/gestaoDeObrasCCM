"use client";

import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";

import { deletePublicationRestriction } from "@/actions/restrictions";
import { ButtonComponent } from "@/components/common/Button";
import ModalComponent from "@/components/common/Modal";
import { useUser } from "@/contexts/userContext";
import { useFeedback } from "@/hooks/useFeedback";
import { formatPercentage } from "@/utils/formatValue";
import { isValidDateString } from "@/utils/validDate";
import { ExclamationCircleIcon } from "@heroicons/react/20/solid";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";

dayjs.extend(utc);

interface PublicationRestrictionsTableProps {
  data: any[];
  columns: Record<string, string>;
  handleAdd: (item: any) => void;
}

export default function PublicationRestrictionsTable({
  data,
  columns,
  handleAdd,
}: PublicationRestrictionsTableProps) {
  const router = useRouter();
  const { permissions } = useUser();

  const [isPending, startTransition] = useTransition();
  const [isMounted, setIsMounted] = useState(false);

  const { showError, showSuccess } = useFeedback();

  const [openConfirmModal, setOpenConfirmModal] = useState(false);

  const [restrictionToDelete, setRestrictionToDelete] = useState<number | null>(
    null,
  );

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleOpenConfirmDelete = (id: number) => {
    setRestrictionToDelete(id);
    setOpenConfirmModal(true);
  };

  const confirmDelete = () => {
    if (restrictionToDelete === null) return;

    startTransition(async () => {
      try {
        const response =
          await deletePublicationRestriction(restrictionToDelete);

        if (!response.success) {
          showError(response.error || "Erro ao excluir restrição");
          return;
        }

        showSuccess(response.message, () => router.refresh());
      } catch (error: any) {
        showError(error.message);
      } finally {
        setOpenConfirmModal(false);
        setRestrictionToDelete(null);
      }
    });
  };

  return (
    <>
      <Paper className="mb-6 w-[95%] min-h-96 h-[720px] lg:h-[560px] xl:h-[90%] max-h-[880px] lg:max-h-[680px] xl:max-h-[90%]">
        <TableContainer className="h-full overflow-y-auto">
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                {Object.keys(columns)
                  .slice(1)
                  .map((column) => (
                    <TableCell
                      key={column}
                      className={`py-1 px-2 text-center text-zinc-700 font-semibold text-xl bg-[#53FF75] sticky left-0 z-10 min-w-28 ${
                        column === "ovnota" ? "sticky left-0 z-20" : ""
                      }`}
                    >
                      {columns[column]}
                    </TableCell>
                  ))}

                {isMounted &&
                  (((permissions?.permissao === "Parcial" ||
                    permissions?.permissao === "Total") &&
                    permissions?.permissao_visualizacao === "total") ||
                    permissions?.permissao_publicacao) && (
                    <TableCell className="py-1 px-2 bg-[#53FF75] min-w-52 sticky left-0 z-10" />
                  )}
              </TableRow>
            </TableHead>

            <TableBody>
              {data.map((item: any, rowIndex: number) => (
                <TableRow
                  key={rowIndex}
                  sx={{
                    "& > td": {
                      maxHeight: "4rem",
                      padding: "4px 8px",
                      lineHeight: "1.1",
                    },
                  }}
                  className="hover:bg-gray-50 transition-colors duration-200"
                >
                  {Object.keys(columns)
                    .slice(1)
                    .map((column, index) => {
                      let cellValue = item[column];

                      if (["prog", "exec"].includes(column)) {
                        cellValue = formatPercentage(cellValue);
                      }

                      if (
                        typeof cellValue === "string" &&
                        isValidDateString(cellValue) &&
                        dayjs(cellValue).isValid()
                      ) {
                        const date = dayjs(cellValue);

                        cellValue =
                          date.utc().year() === 1970
                            ? date.utc().format("HH:mm")
                            : date.utc().format("DD/MM/YYYY");
                      }

                      return (
                        <TableCell
                          key={index}
                          className={`py-0 px-2 text-center font-medium text-lg min-w-36 text-nowrap ${
                            column === "ovnota"
                              ? "hover:cursor-pointer sticky left-0 z-20 bg-white"
                              : ""
                          }`}
                          onClick={() =>
                            column === "ovnota"
                              ? router.push(`/detalhes/${item.id}`)
                              : undefined
                          }
                        >
                          {cellValue}
                        </TableCell>
                      );
                    })}

                  {isMounted &&
                    (((permissions?.permissao === "Parcial" ||
                      permissions?.permissao === "Total") &&
                      permissions?.permissao_visualizacao === "total") ||
                      permissions?.permissao_publicacao) && (
                      <TableCell className="text-center flex">
                        <ButtonComponent
                          text="Editar"
                          styled="min-w-8 mr-2"
                          onClick={() => handleAdd(item)}
                        />

                        <ButtonComponent
                          text="Excluir"
                          styled="min-w-8 bg-red-600 hover:bg-red-700"
                          onClick={() =>
                            handleOpenConfirmDelete(
                              item.id_restricao_publicacao,
                            )
                          }
                        />
                      </TableCell>
                    )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <ModalComponent
        title="Confirmar exclusão"
        open={openConfirmModal}
        onClose={() => setOpenConfirmModal(false)}
      >
        <div className="flex flex-col items-center gap-6">
          <ExclamationCircleIcon
            width={48}
            height={48}
            className="text-red-500"
          />

          <span className="text-center text-lg text-gray-700 dark:text-gray-200">
            Tem certeza que deseja excluir esta restrição?
            <br />
            <strong>Essa ação não poderá ser desfeita.</strong>
          </span>

          <div className="flex gap-4">
            <ButtonComponent
              text="Confirmar Exclusão"
              styled="min-w-32"
              onClick={confirmDelete}
              disabled={isPending}
            />
          </div>
        </div>
      </ModalComponent>
    </>
  );
}
