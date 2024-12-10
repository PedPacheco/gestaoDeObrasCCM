import { mountUrl } from "./mountUrl";

export async function generateExcel(
  params: Record<string, string>,
  token: string,
  pathname: string
) {
  const url = mountUrl(
    `${process.env.NEXT_PUBLIC_API_URL}/exportacao/${pathname}`,
    params
  );

  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    console.error("Erro ao gerar a planilha:", response.statusText);
    return;
  }

  const blob = await response.blob();

  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = downloadUrl;
  link.download = "Exportação obras em carteira.xlsx";
  document.body.append(link);
  link.click();

  document.body.removeChild(link);
  window.URL.revokeObjectURL(downloadUrl);
}
