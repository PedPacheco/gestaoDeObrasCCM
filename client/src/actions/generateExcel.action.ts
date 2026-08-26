"use server";

export async function exportExcel(url: string, token: string) {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-cache",
  });

  console.log(response);

  if (!response.ok) {
    const errorResponse = await response.json();
    const errorMessage = errorResponse?.message;
    throw new Error(errorMessage);
  }

  return await response.blob();
}
