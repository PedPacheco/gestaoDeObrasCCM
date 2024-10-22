"use client";

import "dayjs/locale/pt-br";
import customParseFormat from "dayjs/plugin/customParseFormat";
import localeData from "dayjs/plugin/localeData";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import dayjs from "dayjs";
import { capitalize } from "@/utils/capitalize";

dayjs.extend(localeData);
dayjs.extend(customParseFormat);
dayjs.locale("pt-br");

interface ScheduleTableProps {
  data: any;
  filterDate: string;
}

export default function WeeklyScheduleTable({
  data,
  filterDate,
}: ScheduleTableProps) {
  return (
    <TableContainer
      className="mb-20 max-w-64 max-h-[880px] lg:max-h-[620px] xl:max-h-[75%] overflow-y-auto"
      component={Paper}
    >
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell className="py-1 px-2 text-center text-zinc-700 font-semibold text-base xl:text-lg bg-[#53FF75] max-w-64 text-nowrap">
              <p>{filterDate}</p>
              {capitalize(dayjs(filterDate, "DD/MM/YYYY").format("dddd"))}
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {data.map((item: any, index: any) => {
            const filteredPrograms = item.programacoes.filter(
              (program: any) => {
                return (
                  dayjs(program.data_prog).format("DD/MM/YYYY") === filterDate
                );
              }
            );

            if (filteredPrograms.length > 0) {
              const program = filteredPrograms[0];
              return (
                <TableRow key={index} className="flex flex-col max-w-64">
                  <TableCell className="py-1 px-2 text-center">
                    {item.ovnota}
                  </TableCell>
                  <TableCell className="py-1 px-2 text-center">
                    {item.parceira}
                  </TableCell>
                  <TableCell className="py-1 px-2 text-center">
                    {item.tipo_abrev}
                  </TableCell>
                  <TableCell className="py-1 px-2 text-center">
                    {dayjs(program.data_prog).format("DD/MM/YYYY")}
                  </TableCell>
                  <TableCell className="p-0">
                    <div className="flex justify-between">
                      <p className="py-1 px-2 text-center w-full">
                        {dayjs(program.hora_ini).format("HH:mm")}
                      </p>
                      <span className="border border-solid"></span>
                      <p className="py-1 px-2 text-center w-full">
                        {dayjs(program.hora_ter).format("HH:mm")}
                      </p>
                    </div>
                  </TableCell>
                </TableRow>
              );
            }

            return null;
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
