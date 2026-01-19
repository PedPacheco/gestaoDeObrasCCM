import { capitalize } from "@/utils/formatValue";
import { isValidDateString } from "@/utils/validDate";
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
import utc from "dayjs/plugin/utc";
import { useRouter } from "next/navigation";

dayjs.extend(utc);

interface DivergentConclusionTableProps {
  divergentConclusionData: any[];
}

export function DivergentConclusionTable({
  divergentConclusionData,
}: DivergentConclusionTableProps) {
  const router = useRouter();

  const columns = ["ovnota", "dataConclusao", "dataProgramada"];

  return (
   <TableContainer component={Paper} className="min-h-[24rem] h-[50vh] md:h-[60vh] lg:h-[75vh] overflow-y-autorounded-xl shadow">
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableCell
                className="text-zinc-700 font-semibold text-base lg:text-xl bg-[#53FF75] sticky p-2"
                key={index}
              >
                {capitalize(column)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {divergentConclusionData.map((row, i) => {
            return (
              <TableRow key={i} hover>
                {columns.map((column, key) => {
                  let cellValue = row[column];

                  if (
                    typeof cellValue === "string" &&
                    isValidDateString(cellValue) &&
                    dayjs(cellValue).isValid()
                  ) {
                    cellValue = dayjs(cellValue).utc().format("DD/MM/YYYY");
                  }

                  return (
                    <TableCell
                      className="text-sm lg:text-base text-nowrap hover:cursor-pointer p-2"
                      key={key}
                      onClick={() => router.push(`/detalhes/${row.id}`)}
                    >
                      {cellValue}
                    </TableCell>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
