export function Transform(filters: Record<string, string[]>) {
  return Object.fromEntries(
    Object.entries(filters).map(([key, value]) => [
      key,
      Array.isArray(value) && value.length > 0 ? value.join(",") : "",
    ])
  );
}
