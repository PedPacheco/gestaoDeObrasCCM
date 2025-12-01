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
    { name: "Exportar viabilidade", path: "", visible: true },
  ];

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        height: { xs: "auto", md: "90%" },
        marginTop: { xs: 0, md: 3, lg: 1 },
        p: { xs: 2, sm: 3, md: 6 },
        backgroundColor: "background.default",
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 800,
          boxShadow: 6,
          borderRadius: 4,
          p: 2,
        }}
      >
        <CardContent sx={{ p: 2 }}>
          <Typography
            variant="h5"
            align="center"
            fontWeight="bold"
            color="text.primary"
            gutterBottom
            sx={{
              fontSize: { xs: 22, sm: 24, md: 28 },
              mb: { xs: 3, sm: 4, md: 5 },
            }}
          >
            Exportação de Dados
          </Typography>

          {exportOptions.map((option, index) => (
            <WrapperExportButton
              text={option.name}
              path={option.path}
              token={token}
              visible={option.visible}
              key={index}
            />
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}
