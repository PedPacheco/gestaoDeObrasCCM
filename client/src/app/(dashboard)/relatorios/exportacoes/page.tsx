import WrapperExportButton from "@/components/exports/wrapperExportButton";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ExportPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const exportOptions = [
    {
      name: "EXPORTAÇÃO DADOS OBRAS",
      path: "obras-carteira-bi",
      visible: true,
    },
    {
      name: "EXPORTACAO DADOS OBRAS EXECUTADAS",
      path: "obras-executadas-bi",
      visible: true,
    },
    {
      name: "EXPORTACAO DAS PROGRAMACOES E RESTRICOES",
      path: "programacoes-bi",
      visible: true,
    },
    {
      name: "Exportar obras a serem multadas",
      path: "obras-multas",
      visible: false,
    },
    {
      name: "Exportar relatórios de execução",
      path: "relatorio-execucao",
      visible: false,
    },
    {
      name: "Exportar capacidade de execução",
      path: "capacidade-execucao",
      visible: true,
    },
    { name: "Exportar dados suspensões", path: "suspensoes", visible: false },
    { name: "Exportar viabilidade", path: "viabilidade", visible: true },
    { name: "Exportar Forecast", path: "forecast", visible: false },
    {
      name: "Exportar Programações Reprovadas",
      path: "reprovacoes",
      visible: false,
    },

    {
      name: "Exportar Ordens para atualização MO/Material",
      path: "ordens",
      visible: false,
    },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        minHeight: "90%",
        backgroundColor: "background.default",
        py: { xs: 4, md: 6 }, // padding vertical
        px: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 900,
          borderRadius: 4,
          overflowY: "auto",
          boxShadow: 6,
        }}
      >
        <CardContent sx={{ p: { xs: 3, md: 5 } }}>
          <Typography
            variant="h4"
            align="center"
            fontWeight="bold"
            sx={{
              fontSize: { xs: 20, sm: 24, md: 28 },
              mb: 4,
            }}
          >
            Exportação de Dados
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {exportOptions.map((option) => (
              <WrapperExportButton
                key={option.path || option.name}
                text={option.name}
                path={option.path}
                token={token}
                visible={option.visible}
              />
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
