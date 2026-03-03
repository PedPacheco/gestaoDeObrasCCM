import { ButtonForBILink } from "@/components/exports/buttonForBILink";
import { Box, Card, CardContent, Typography } from "@mui/material";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function BiReports() {
  const exportOptions = [
    {
      name: "Capex DSPT",
      path: "obras-multas",
      visible: false,
    },
    {
      name: "Blitz de Segurança",
      path: "https://app.powerbi.com/groups/me/apps/2a7a60bb-a7cd-4376-b59a-662f2e8c478b/reports/853706ab-0389-4dc8-a75b-11ebb358aa03/ReportSectionc68ab510d8e1c026b285?experience=power-bi",
      visible: true,
    },
    {
      name: "KPI de Segurança",
      path: "https://app.powerbi.com/groups/me/apps/2a7a60bb-a7cd-4376-b59a-662f2e8c478b/reports/3a1a7515-a468-43e7-864d-1b0c42f7e818/ReportSection?experience=power-bi",
      visible: true,
    },
    {
      name: "Controle SMC",
      path: "https://app.powerbi.com/groups/me/apps/cf6dceda-2355-4078-9a15-d1fd15fc4688/reports/decbfee6-e20b-4fca-bc6d-a0585270e1cb/ReportSection?ctid=bf86fbdb-f8c2-440e-923c-05a60dc2bc9b&experience=power-bi",
      visible: true,
    },
    {
      name: "Gerenciamento SMC",
      path: "",
      visible: true,
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
            variant="h5"
            align="center"
            fontWeight="bold"
            sx={{
              fontSize: { xs: 20, sm: 24, md: 28 },
              mb: 4,
            }}
          >
            Links para BI&apos;s da DSPT
          </Typography>

          <Box
            sx={{
              display: "flex",
              flexDirection: "column",
              gap: 2,
            }}
          >
            {exportOptions.map((option) => (
              <ButtonForBILink
                key={option.path || option.name}
                text={option.name}
                path={option.path}
                visible={option.visible}
              />
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
