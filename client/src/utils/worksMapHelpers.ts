import { ObraPin, SelectedFilters } from "@/interfaces/worksMapInterface";

/**
 * Gera o HTML do popup Leaflet para uma obra.
 * Função pura — facilmente testável sem montar componentes React.
 */
export function buildObraPopup(obra: ObraPin): string {
  return `
    <div style="min-width:190px;font-family:sans-serif;font-size:13px;line-height:1.6">
      <strong style="font-size:14px">${obra.ovnota}</strong><br/>
      <b>Ref:</b> ${obra.referencia ?? "-"}<br/>
      <b>Tipo:</b> ${obra.tipo_obra ?? "-"}<br/>
      <b>Status:</b> ${obra.status ?? "-"}<br/>
      <b>Município:</b> ${obra.municipio ?? "-"}<br/>
      <b>Bairro:</b> ${obra.bairro ?? "-"}<br/>
      <a href="/detalhes/${obra.ovnota}" style="color:#2563eb;font-weight:600">Ver detalhes →</a>
    </div>
  `;
}

/**
 * Converte o estado de filtros selecionados em query params para a API.
 * Omite chaves com arrays vazios.
 */
export function buildFilterParams(
  filters: SelectedFilters,
): Record<string, string> {
  return Object.fromEntries(
    (Object.entries(filters) as [keyof SelectedFilters, string[]][])
      .filter(([, v]) => v.length > 0)
      .map(([k, v]) => [k, v.join(",")]),
  );
}
