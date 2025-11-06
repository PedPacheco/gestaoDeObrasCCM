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

interface UndefinedItemsTableProps {
  undefinedItemsData: any[];
}

export function UndefinedItemsTable({
  undefinedItemsData,
}: UndefinedItemsTableProps) {
  const router = useRouter();

  const columns = ["ovnota", "municipio", "tipo", "circuito", "parceira"];

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
          {undefinedItemsData.map((row, i) => (
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
