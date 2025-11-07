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

interface ScheduleErrorTableProps {
  scheduleErrorData: any[];
}

export function ScheduleErrorTable({
  scheduleErrorData,
}: ScheduleErrorTableProps) {
  const router = useRouter();

  const columns = ["ovnota", "parceira", "executado", "prog", "total"];

  return (
    <TableContainer component={Paper}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableCell
                className="text-zinc-700 font-semibold text-xl bg-[#53FF75] sticky"
                key={index}
              >
                {capitalize(column)}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {scheduleErrorData.map((row, i) => (
            <TableRow key={i} hover>
              {columns.map((column, key) => (
                <TableCell
                  className="text-base hover:cursor-pointer"
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
