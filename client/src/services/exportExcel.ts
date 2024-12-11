export async function exportExcel(url: string, token: string) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorResponse = await response.json();
    const errorMessage = errorResponse?.message;
    throw new Error(errorMessage);
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
