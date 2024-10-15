export function mountUrl(
  baseUrl: string,
  params?: Record<string, string | boolean>
) {
  let url = baseUrl;
  let query: string[] = [];

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value || value === false) {
        query.push(`${key}=${value}`);
      }
    }
  }

  if (query.length > 0) {
    url += `?${query.join("&")}`;
  }

  return url;
}
