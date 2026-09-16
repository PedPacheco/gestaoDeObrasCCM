"use server";

type ExportSuccess = {
  success: true;
  data: Blob;
  token: string;
};

type ExportError = {
  success: false;
  message: string;
  token: string;
};

type ExportResponse = ExportSuccess | ExportError;

export async function exportExcel(
  url: string,
  token: string,
): Promise<ExportResponse> {
  const res = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
    cache: "no-cache",
  });

  if (res.status === 401 || res.status === 404) {
    const json = await res.json();

    return {
      success: false,
      message: json.message,
      token,
    };
  }

  const blob = await res.blob();

  return {
    success: true,
    data: blob,
    token,
  };
}
