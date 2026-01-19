import { capitalize } from "@/utils/formatValue";
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from "@mui/material";
import { useRouter } from "next/navigation";

interface ExecutionDifferentialProps {
  executionDifferentialData: any[];
}

export function ExecutionDifferentialTable({
  executionDifferentialData,
}: ExecutionDifferentialProps) {
  const router = useRouter();

  const columns = ["ovnota", "executado", "somaExec"];

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
          {executionDifferentialData.map((row, i) => (
            <TableRow key={i} hover>
              {columns.map((column, key) => (
                <TableCell
                  className="text-sm lg:text-base text-nowrap hover:cursor-pointer p-2"
                  key={key}
                  onClick={() => router.push(`/detalhes/${row.id}`)}
                >
                  {row[column]}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
