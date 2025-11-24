import { PlusIcon } from "@heroicons/react/20/solid";
import {
  Box,
  Button,
  Checkbox,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { useState } from "react";

interface ScheduledServicesProps {
  scheduledServicesData: any[];
}

const serviceColumns = [
  { key: "material", label: "CÓDIGO" },
  { key: "textoBreve", label: "SERVIÇO" },
  { key: "operacao", label: "OPERAÇÃO" },
  { key: "ponto", label: "PONTO" },
  { key: "dataProg", label: "DATA PROG" },
  { key: "qtdePlanejada", label: "PLAN", align: "right" },
  { key: "qtdeProgramada", label: "PLAN TOTAL", align: "right" },
  { key: "qtdeRealizada", label: "REAL", align: "right" },
  { key: "dif", label: "DIF" },
  { key: "valorUnit", label: "VALOR UNIT", align: "right" },
  { key: "valorReal", label: "VALOR REAL" },
];

export function ScheduledServices({
  scheduledServicesData,
}: ScheduledServicesProps) {
  const [scheduledServices, setScheduledServices] = useState<any[]>(
    scheduledServicesData
  );

  return (
    <Paper className="p-6 min-h-96">
      <Typography className="text-xl font-semibold text-gray-700 mb-2">
        SERVIÇOS PROGRAMADOS
      </Typography>

      <TableContainer component={Paper} sx={{ height: 380 }}>
        <Table stickyHeader size="small" className="text-sm h-full">
          <TableHead className="bg-gray-100">
            <TableRow>
              <TableCell></TableCell>
              {serviceColumns.map((header, index) => (
                <TableCell key={index} className="text-nowrap">
                  {header.label}
                </TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {scheduledServicesData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                  Nenhum serviço programado
                </TableCell>
              </TableRow>
            ) : (
              scheduledServicesData?.map((row, index) => (
                <TableRow key={index} hover>
                  <TableCell className="max-h-9">
                    <Checkbox checked={scheduledServices.includes(index)} />
                  </TableCell>

                  {serviceColumns.map((col, index) => (
                    <TableCell key={index} className="text-nowrap max-h-9">
                      {row[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box className="flex justify-end mt-4">
        <Button
          variant="contained"
          startIcon={<PlusIcon className="w-5 h-5 text-white" />}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
        >
          REALIZAR SERVIÇOS
        </Button>
      </Box>
    </Paper>
  );
}
