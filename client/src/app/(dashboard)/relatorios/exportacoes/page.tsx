import { fetchFilters } from "@/actions/fetchFilters.action";
import WrapperExportButton from "@/components/exports/wrapperExportButton";
import { Box, Card, CardContent, Typography } from "@mui/material";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function ExportPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const options = await fetchFilters({
    parceira: true,
    equipes: true,
  });

  const exportOptions = [
    {
      name: "dados obras em carteira",
      path: "obras-carteira-bi",
      visible: true,
      filterType: "none",
    },
    {
      name: "dados obras executadas",
      path: "obras-executadas-bi",
      visible: true,
      filterType: "none",
    },
    {
      name: "programações e restrições",
      path: "programacoes-bi",
      visible: true,
      filterType: "none",
    },
    {
      name: "programação ponto a ponto",
      path: "servicos",
      visible: true,
      filterType: "services",
    },
    {
      name: "relatórios de execução",
      path: "relatorio-execucao",
      visible: false,
      filterType: "none",
    },
    {
      name: "capacidade de execução",
      path: "capacidade-execucao",
      visible: true,
      filterType: "none",
    },
    {
      name: "dados suspensões",
      path: "suspensoes",
      visible: false,
      filterType: "none",
    },
    {
      name: "viabilidades em aprovação",
      path: "viabilidade/aguardando-aprovacao",
      visible: true,
      filterType: "partner",
    },
    {
      name: "viabilidades pendentes",
      path: "viabilidade/aguardando-viabilidade",
      visible: true,
      filterType: "partner",
    },
    { name: "Forecast", path: "forecast", visible: false, filterType: "none" },
    {
      name: "Programações Reprovadas",
      path: "reprovacoes",
      visible: false,
      filterType: "none",
    },
    {
      name: "Exportar Ordens para atualização MO/Material",
      path: "ordens",
      visible: false,
      filterType: "none",
    },
    {
      name: "Exportar Relatório para Publicações",
      path: "relatorio-publicacoes",
      visible: false,
      filterType: "none",
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
                options={options}
                filterType={option.filterType}
              />
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
