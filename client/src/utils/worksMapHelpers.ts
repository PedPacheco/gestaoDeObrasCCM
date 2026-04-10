import { MapFilterItem } from "@/contexts/mapFilterContext";
import { ObraPin } from "@/interfaces/worksMapInterface";

export function buildObraPopup(obra: ObraPin): string {
  return `
    <div style="min-width:190px;font-family:sans-serif;font-size:13px;line-height:1.6">
      <strong style="font-size:14px">${obra.ovnota}</strong><br/>
      <b>Ordem/Diagrama:</b> ${obra.ordemDiagrama ?? "-"}<br/>
      <b>Ref:</b> ${obra.referencia ?? "-"}<br/>
      <b>Tipo:</b> ${obra.tipo_obra ?? "-"}<br/>
      <b>Status:</b> ${obra.status ?? "-"}<br/>
      <b>Município:</b> ${obra.municipio ?? "-"}<br/>
      <b>Bairro:</b> ${obra.bairro ?? "-"}<br/>
      <a href="/detalhes/${obra.ovnota}" style="color:#2563eb;font-weight:600">Ver detalhes →</a>
    </div>
  `;
}

export const buildPayloadForEquipments = (filters?: MapFilterItem[]) => {
  if (!filters?.length) return { items: [] };

  const payload = filters.map((f) => ({
    ovnota: f.ovnota ?? "",
    ordemDiagrama: f.ordemDiagrama ?? "",
  }));

  return {
    items: payload.map((p) => ({
      ovnota: p.ovnota, // 🔥 corrigido
      ordemDiagrama: p.ordemDiagrama,
    })),
  };
};

export const buildKey = (o?: string, d?: string) => `${o ?? ""}::${d ?? ""}`;
