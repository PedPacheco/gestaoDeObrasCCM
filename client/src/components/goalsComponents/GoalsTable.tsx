import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useCallback, useMemo, useState } from "react";
import MetasProgramacoesModal from "./goalsSchedulesModal/MetasProgramacoesModal";

interface GoalsTableComponentProps {
  data: any;
  columnMapping: any;
  fixedNumber: number;
  typeGoals: string;
}

export interface ParamsInterface {
  idRegional: number;
  idParceira: number;
  idTipo: number;
  parceira: string;
  regional: string;
  mes: number;
  ano: number;
  executado: boolean;
}

const MONTH_MAP: Record<string, number> = {
  jan: 1,
  fev: 2,
  mar: 3,
  abr: 4,
  mai: 5,
  jun: 6,
  jul: 7,
  ago: 8,
  set: 9,
  out: 10,
  nov: 11,
  dez: 12,
};

export default function GoalsTable({
  data,
  columnMapping,
  fixedNumber,
  typeGoals,
}: GoalsTableComponentProps) {
  const [open, setOpen] = useState<boolean>(false);
  const [modalLabel, setModalLabel] = useState<string>("");
  const [params, setParams] = useState<ParamsInterface | null>(null);

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

  const handleOpenModal = (item: any, month: string, executado: boolean) => {
    const monthNumber = MONTH_MAP[month];

    setParams({
      idRegional: item.id_regional,
      idParceira: item.id_parceira,
      idTipo: item.id_tipo,
      parceira: item.turma,
      regional: item.regional,
      mes: monthNumber,
      ano: item.anocalc,
      executado,
    });

    setOpen(true);
  };

  return (
    <>
      <TableContainer
        className="w-[95%] min-h-96 h-[90%] max-h-[90%] overflow-y-auto mb-4"
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
                <TableRow key={index} className="h-16">
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
                    .map((month) => {
                      return (
                        <TableCell key={month} className="p-0 h-16 w-4 ">
                          <div className="flex flex-col">
                            <p className="py-1 px-2 text-center text-base text-zinc-700">
                              {item[month].meta?.toFixed(fixedNumber)}
                            </p>
                            <p
                              className="py-1 px-2 text-center border-b-0 text-base text-zinc-700 hover:cursor-pointer"
                              onClick={() => {
                                handleOpenModal(item, month, false);
                                setModalLabel("PROGRAMADO");
                              }}
                            >
                              {item[month].prog?.toFixed(fixedNumber)}
                            </p>
                            <p
                              className="py-1 px-2 text-center border-b-0 text-base text-zinc-700 hover:cursor-pointer"
                              onClick={() => {
                                handleOpenModal(item, month, true);
                                setModalLabel("EXECUTADO");
                              }}
                            >
                              {item[month].real?.toFixed(fixedNumber)}
                            </p>
                          </div>
                        </TableCell>
                      );
                    })}

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

      {open && (
        <MetasProgramacoesModal
          open={open}
          setOpen={setOpen}
          params={params}
          label={modalLabel}
        />
      )}
    </>
  );
}
