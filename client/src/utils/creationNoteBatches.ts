type IW38Item = {
  campo_ordenacao: string;
  pep: string;
  tipo_de_ordem: string;
  conjunto: string;
  texto_breve: string;
  grp_plnj_pm: string;
  ordem: string;
  denominacao: string;
};

type Agrupado = {
  campo_ordenacao: string;
  conjunto: string;
  denominacao: string;
  grp_plnj_pm: string;
  ordem_dca: string;
  ordem_dcd: string;
  ordem_dci: string;
  ordem_dcim: string;
  pep: string;
  texto_breve: string;
};

function groupMaterialsByDiagram(materialData: any[]) {
  const materialMap = new Map<string, any[]>();

  materialData.forEach((material) => {
    const diagramaRede = material.diagrama_rede;
    if (!materialMap.has(diagramaRede)) {
      materialMap.set(diagramaRede, []);
    }
    materialMap.get(diagramaRede)!.push(material);
  });

  return materialMap;
}

// Função para criar lotes de dados
export function createBatches(
  groupData: any[],
  materialData: any[],
  batchSize: number = 150
) {
  const materialMap = groupMaterialsByDiagram(materialData);
  const batches: any[] = [];
  let currentBatch: any[] = [];
  let currentBatchSize = 0;

  groupData.forEach((nota) => {
    // Buscar materiais relacionados à nota atual
    const relatedMaterials: any[] = [];

    // Verificar cada campo de ordem da nota
    const ordemFields = ["ordem_dci", "ordem_dcd", "ordem_dca", "ordem_dcim"];

    ordemFields.forEach((field) => {
      const ordemValue = nota[field];

      if (ordemValue && materialMap.has(ordemValue)) {
        relatedMaterials.push(...materialMap.get(ordemValue)!);
      }
    });

    // Criar o item do lote
    const batchItem = {
      notesData: nota,
      materialData: relatedMaterials,
    };

    // Calcular o tamanho estimado do item (nota + materiais)
    const itemSize = 1 + relatedMaterials.length;

    // Verificar se precisa criar um novo lote
    if (currentBatchSize + itemSize > batchSize && currentBatch.length > 0) {
      batches.push([...currentBatch]);
      currentBatch = [];
      currentBatchSize = 0;
    }

    currentBatch.push(batchItem);
    currentBatchSize += itemSize;
  });

  // Adicionar o último lote se não estiver vazio
  if (currentBatch.length > 0) {
    batches.push(currentBatch);
  }

  return batches;
}

export function groupNoteDate(iw38Data: IW38Item[]): Agrupado[] {
  const mapa = new Map<string, Agrupado>();

  for (const item of iw38Data) {
    const chaveBase = [
      item.campo_ordenacao,
      item.conjunto,
      item.denominacao,
      item.grp_plnj_pm,
    ];

    const chave =
      item.tipo_de_ordem === "DCIM"
        ? [...chaveBase, "DCIM"].join("|")
        : chaveBase.join("|");

    if (!mapa.has(chave)) {
      mapa.set(chave, {
        campo_ordenacao: item.campo_ordenacao,
        conjunto: item.conjunto,
        denominacao: item.denominacao,
        grp_plnj_pm: item.grp_plnj_pm,
        ordem_dca: "",
        ordem_dcd: "",
        ordem_dci: "",
        ordem_dcim: "",
        pep: item.pep,
        texto_breve: item.texto_breve,
      });
    }

    const agrupado = mapa.get(chave)!;

    switch (item.tipo_de_ordem) {
      case "DCA":
        agrupado.ordem_dca = item.ordem;
        break;
      case "DCD":
        agrupado.ordem_dcd = item.ordem;
        break;
      case "DCI":
        agrupado.ordem_dci = item.ordem;
        break;
      case "DCIM":
        agrupado.ordem_dcim = item.ordem;
        break;
    }
  }

  return Array.from(mapa.values());
}
