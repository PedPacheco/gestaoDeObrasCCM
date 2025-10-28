import { ExportButton } from "@/components/exports/exportButton";
import { Box, Card, CardContent, Typography, Stack } from "@mui/material";
import { cookies } from "next/headers";

export default async function ExportPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("token")?.value;

  const exportOptions = [
    { name: "EXPORTAÇÃO DADOS OBRAS", path: "obras-carteira-bi" },
    { name: "Exportar dados de obras executadas", path: "" },
    { name: "Exportar dados restrições", path: "" },
    { name: "Exportar obras a serem multadas", path: "" },
    { name: "Exportar capacidade de execução", path: "" },
    { name: "Exportar dados suspensões", path: "" },
    { name: "Exportar viabilidade", path: "" },
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
            <ExportButton
              text={option.name}
              path={option.path}
              token={token}
              key={index}
            />
          ))}
        </CardContent>
      </Card>
    </Box>
  );
}
