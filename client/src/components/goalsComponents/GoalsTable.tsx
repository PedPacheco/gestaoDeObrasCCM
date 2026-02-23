import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useCallback, useMemo } from "react";

interface GoalsTableComponentProps {
  data: any;
  columnMapping: any;
  fixedNumber: number;
  typeGoals: string;
}

export default function GoalsTable({
  data,
  columnMapping,
  fixedNumber,
  typeGoals,
}: GoalsTableComponentProps) {
  const calculateSum = useCallback(
    (item: any) => {
      const months = Object.keys(columnMapping).slice(
        typeGoals === "rda" ? 6 : 5,
        -2,
      );
      const sums = {
        meta: 0,
        prog: 0,
        real: 0,
      };

      months.forEach((month) => {
        sums.meta += item[month].meta;
        sums.prog += item[month].prog;
        sums.real += item[month].real;
      });

      return sums;
    },
    [columnMapping, typeGoals],
  );

  const sumValues = useMemo(() => {
    if (data) {
      return data.map((item: any) => calculateSum(item));
    }
  }, [data, calculateSum]);

  return (
    <TableContainer
      className="w-[95%] min-h-96 h-[90%] max-h-[880px] lg:max-h-[640px] overflow-y-auto mb-4"
      component={Paper}
    >
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {Object.keys(columnMapping).map((month) => (
              <TableCell
                key={month}
                className="py-1 px-2 text-center text-zinc-700 font-semibold text-xl bg-[#53FF75] shadow-md"
              >
                {columnMapping[month as keyof typeof columnMapping]}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {data?.map((item: any, index: any) => {
            const sums = sumValues[index];

            return (
              <TableRow
                key={`${item.regional}-${item.tipo_obra}-${item.turma}-${item.anocalc}`}
                className="h-16"
              >
                <TableCell className="p-0 px-2 text-center text-nowrap text-base text-zinc-700 ">
                  {item.regional}
                </TableCell>
                <TableCell className="p-0 px-2 text-center text-nowrap text-base text-zinc-700 ">
                  {item.tipo_obra}
                </TableCell>
                <TableCell className="p-0  px-2 text-center text-nowrap text-base text-zinc-700 ">
                  {item.turma}
                </TableCell>
                <TableCell className="p-0 px-2 text-center text-nowrap text-base text-zinc-700 ">
                  {item.anocalc}
                </TableCell>
                {typeGoals === "rda" && (
                  <TableCell className="p-0 px-3 text-center text-nowrap text-base text-zinc-700 ">
                    {item.empreendimento}
                  </TableCell>
                )}

                <TableCell className="p-0 h-16 text-center ">
                  <div className="flex flex-col">
                    <p className="py-1 px-2 text-center text-base text-zinc-700">
                      META
                    </p>
                    <p className="py-1 px-2 text-center text-base text-zinc-700">
                      PROG
                    </p>
                    <p className="py-1 px-2 text-center text-base text-zinc-700">
                      REAL
                    </p>
                  </div>
                </TableCell>

                {Object.keys(columnMapping)
                  .slice(typeGoals === "rda" ? 6 : 5, -2)
                  .map((month) => (
                    <TableCell key={month} className="p-0 h-16 w-4 ">
                      <div className="flex flex-col">
                        <p className="py-1 px-2 text-center text-base text-zinc-700">
                          {item[month].meta?.toFixed(fixedNumber)}
                        </p>
                        <p className="py-1 px-2 text-center border-b-0 text-base text-zinc-700">
                          {item[month].prog?.toFixed(fixedNumber)}
                        </p>
                        <p className="py-1 px-2 text-center border-b-0 text-base text-zinc-700">
                          {item[month].real?.toFixed(fixedNumber)}
                        </p>
                      </div>
                    </TableCell>
                  ))}

                <TableCell className="p-0 h-16 text-center w-4 ">
                  <div className="flex flex-col">
                    <p className="py-1 px-2 text-center font-semibold text-base text-zinc-700">
                      {sums.meta.toFixed(fixedNumber)}
                    </p>
                    <p className="py-1 px-2 text-center font-semibold text-base text-zinc-700">
                      {sums.prog.toFixed(fixedNumber)}
                    </p>
                    <p className="py-1 px-2 text-center font-semibold text-base text-zinc-700">
                      {sums.real.toFixed(fixedNumber)}
                    </p>
                  </div>
                </TableCell>

                <TableCell className="p-0 text-center text-red-600 text-base ">
                  {item.carteira?.toFixed(fixedNumber)}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
