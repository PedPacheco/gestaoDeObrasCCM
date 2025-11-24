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
                className="text-zinc-700 font-semibold text-base lg:text-xl bg-[#53FF75] sticky p-2"
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
