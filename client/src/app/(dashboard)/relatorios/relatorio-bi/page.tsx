import { ButtonForBILink } from "@/components/exports/buttonForBILink";
import { Box, Card, CardContent, Typography } from "@mui/material";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const categories = [
  {
    title: "Segurança",
    items: [
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
        name: "Queremos te Ouvir",
        path: "https://app.powerbi.com/reportEmbed?reportId=8bc04354-c9ce-4190-9359-e89456c3f1eb&autoAuth=true&ctid=bf86fbdb-f8c2-440e-923c-05a60dc2bc9b",
        visible: true,
      },
      { name: "Cority", path: "https://edp.my.cority.com/#/login", visible: true },
      {
        name: "Dono de Área",
        path: "https://app.powerbi.com/groups/me/reports/ecba28d6-7cd7-4e7d-93a3-8fa9e1721a47/ReportSectioncf3acd87e138dbe95798?ctid=bf86fbdb-f8c2-440e-923c-05a60dc2bc9b&experience=power-bi",
        visible: true,
      },
      {
        name: "IDSP",
        path: "https://app.powerbi.com/groups/me/reports/bbf29767-901a-455a-a195-496707fb2b1d/ReportSectione1123600e23295a15c91?ctid=bf86fbdb-f8c2-440e-923c-05a60dc2bc9b&experience=power-bi",
        visible: true,
      },
    ],
  },
  {
    title: "Pessoas",
    items: [
      {
        name: "EDPON",
        path: "https://edpon.edp.com/pt-br/login?destination=/pt-br?check_logged_in%3D1",
        visible: true,
      },
      {
        name: "Portal de Serviços",
        path: "https://portaldeservicos.edpbr.com.br/?OriginalURL=/PortalDeServicos/",
        visible: true,
      },
      { name: "About Me", path: "https://performancemanager5.successfactors.eu/", visible: true },
      {
        name: "Udemy",
        path: "https://www.udemy.com/join/passwordless-auth/?next=/course/desenvolvedor-android-iniciante/learn/lecture/14615270",
        visible: true,
      },
    ],
  },
  {
    title: "Cliente",
    items: [
      {
        name: "COI – DEC Programado",
        path: "https://app.powerbi.com/groups/me/apps/dbbb2da8-9f21-40d2-a67c-2581d3eb9763/reports/1da4d483-62d4-43fb-aded-8b8afee9c09f/ReportSectiona1a0d37cb4b057d6535c?experience=power-bi",
        visible: true,
      },
    ],
  },
  {
    title: "Eficiência",
    items: [
      {
        name: "Capex DSPT",
        path: "https://app.powerbi.com/groups/me/apps/2a7a60bb-a7cd-4376-b59a-662f2e8c478b/reports/05471fc0-7c31-43e1-9afe-2562ee498d81/ReportSection7623530240a29221ca51?experience=power-bi",
        visible: true,
      },
      {
        name: "Controle SMC",
        path: "https://app.powerbi.com/groups/me/apps/cf6dceda-2355-4078-9a15-d1fd15fc4688/reports/decbfee6-e20b-4fca-bc6d-a0585270e1cb/ReportSection?ctid=bf86fbdb-f8c2-440e-923c-05a60dc2bc9b&experience=power-bi",
        visible: true,
      },
      { name: "Árteri", path: "https://smc.arteri.com.br/login", visible: true },
      {
        name: "Equipes para Contingência",
        path: "https://forms.office.com/Pages/AnalysisPage.aspx?AnalyzerToken=lc5ZCKhzwj9hYfcfnalSog6wSPsJntfG&&id=2_uGv8L4DkSSPAWmDcK8m7yDM7CWJflBu3ULJobsEoBUOVJBNDAwVVI2Mzk4Tkg4TUw4V0FRV0k5Uy4u",
        visible: true,
      },
      {
        name: "EFEN's / TA's",
        path: "https://apps.powerapps.com/play/e/default-bf86fbdb-f8c2-440e-923c-05a60dc2bc9b/a/7767095b-9129-4a8c-aeff-c595a862ed6d?tenantId=bf86fbdb-f8c2-440e-923c-05a60dc2bc9b&&sourcetime=1747049457490",
        visible: true,
      },
    ],
  },
];

export default async function BiReports() {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "center",
        minHeight: "90%",
        backgroundColor: "background.default",
        py: { xs: 4, md: 6 },
        px: 2,
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: 1400,
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
            Relatório BI&apos;s
          </Typography>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                md: "repeat(4, 1fr)",
              },
              gap: { xs: 4, md: 4 },
              alignItems: "start",
            }}
          >
            {categories.map((category) => (
              <Box key={category.title}>
                <Typography
                  variant="h6"
                  align="center"
                  fontWeight="bold"
                  sx={{ mb: 2, fontSize: { xs: 18, md: 20 } }}
                >
                  {category.title}
                </Typography>
                <Box sx={{ display: "flex", flexDirection: "column" }}>
                  {category.items.map((item) => (
                    <ButtonForBILink
                      key={item.name}
                      text={item.name}
                      path={item.path}
                      visible={item.visible}
                      compact
                    />
                  ))}
                </Box>
              </Box>
            ))}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
