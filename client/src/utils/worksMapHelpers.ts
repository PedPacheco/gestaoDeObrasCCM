import { MapFilterItem } from "@/contexts/mapFilterContext";
import { ObraPin } from "@/interfaces/worksMapInterface";

export function buildObraPopup(obras: ObraPin[]): string {
  if (!obras || obras.length === 0) {
    return `
      <div style="font-family:sans-serif;font-size:13px">
        Nenhuma obra encontrada
      </div>
    `;
  }

  const itemsHtml = obras
    .map((obra) => {
      return `
        <div style="padding:8px 0;border-bottom:1px solid #e5e7eb">
          <strong style="font-size:14px">${obra.ovnota}</strong><br/>
          <b>Ordem/Diagrama:</b> ${obra.ordemDiagrama ?? "Sem ordem/diagrama"}<br/>
          <b>Ref:</b> ${obra.referencia ?? "-"}<br/>
          <b>Tipo:</b> ${obra.tipo_obra ?? "-"}<br/>
          <b>Status:</b> ${obra.status ?? "-"}<br/>
          <b>Município:</b> ${obra.municipio ?? "-"}<br/>
          <b>Bairro:</b> ${obra.bairro ?? "-"}<br/>
          <a 
            href="/detalhes/${obra.ovnota}" 
            target="_blank" 
            rel="noopener noreferrer"
            style="color:#2563eb;font-weight:600"
          >
            Ver detalhes →
          </a>
        </div>
      `;
    })
    .join("");

  return `
    <div style="
      min-width:220px;
      max-width:280px;
      max-height:300px;
      overflow-y:auto;
      font-family:sans-serif;
      font-size:13px;
      line-height:1.6;
      padding-right:4px;
    ">
      ${itemsHtml}
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
