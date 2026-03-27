"use client";

import { useUser } from "@/contexts/userContext";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from "@mui/material";
import { Dispatch, SetStateAction } from "react";

interface ExecutionCapacityTableProps {
  columns: Record<string, string>;
  data: Record<string, string | number | null>[];
  setTableData: Dispatch<
    SetStateAction<Record<string, string | number | null>[]>
  >;
}

export function ExecutionCapacityTable({
  columns,
  data,
  setTableData,
}: ExecutionCapacityTableProps) {
  const { permissions, user } = useUser();

  const editableColumns = [
    "jan",
    "fev",
    "mar",
    "abr",
    "mai",
    "jun",
    "jul",
    "ago",
    "set",
    "out",
    "nov",
    "dez",
  ];

  const handleValueChange = (
    rowIndex: number,
    column: string,
    value: string,
  ) => {
    setTableData((prev) => {
      const updated = [...prev];
      updated[rowIndex] = {
        ...updated[rowIndex],
        [column]: value === "" ? null : value,
      };

      return updated;
    });
  };

  return (
    <TableContainer
      component={Paper}
      className="w-full min-h-96 flex-1 mb-6 overflow-y-auto xl:mb-0 xl:first:mr-8"
    >
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {Object.keys(columns).map((column) => {
              const isEditable = editableColumns.includes(column);

              return (
                <TableCell
                  key={column}
                  className={`py-1 px-2 text-center text-zinc-700 font-semibold text-xl bg-[#53FF75] ${
                    isEditable ? "border-l-2 border-solid" : ""
                  }`}
                >
                  {columns[column as keyof typeof columns]}
                </TableCell>
              );
            })}
          </TableRow>
        </TableHead>
        <TableBody className="h-[620px] 2xl:h-full">
          {data.map((item, rowIndex) => (
            <TableRow key={rowIndex} className="h-16">
              {Object.keys(columns).map((column, colIndex) => {
                const isEditable = editableColumns.includes(column);
                const canEdit =
                  (user?.id_regional === item.id_regional &&
                    permissions?.permissao === "Parcial") ||
                  permissions?.permissao === "Total";

                return (
                  <TableCell
                    key={colIndex}
                    className={`p-0 pl-4 h-16 text-center min-w-28 text-nowrap text-base ${
                      isEditable ? "border-l-2 border-solid" : ""
                    }`}
                  >
                    {isEditable && canEdit ? (
                      <TextField
                        type="text"
                        value={item[column] ?? ""}
                        size="small"
                        variant="standard"
                        className="w-full"
                        InputProps={{ disableUnderline: true }}
                        inputProps={{
                          style: { textAlign: "center" },
                          pattern: "[0-9]*",
                        }}
                        onChange={(e) => {
                          const onlyNumbers = e.target.value.replace(/\D/g, "");
                          const limited = onlyNumbers.slice(0, 2);
                          handleValueChange(rowIndex, column, limited);
                        }}
                      />
                    ) : (
                      item[column]
                    )}
                  </TableCell>
                );
              })}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
