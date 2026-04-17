export function buildEquipamentosFormatados(
  instalacao?: string,
  equipamentos?: string,
  potencias?: string,
  patrimonios?: string,
): string | null {
  if (!instalacao || !equipamentos || !patrimonios) return null;

  const installList = instalacao.split(';');
  const eqList = equipamentos.split(';');
  const patList = patrimonios.split(';');
  const potList = potencias ? potencias.split(';') : [];

  const linhas: string[] = [];
  linhas.push('Equipamento - Instalação - Potência/Marca CS - Patrimônio\n');

  for (let i = 0; i < eqList.length; i++) {
    const eq = eqList[i]?.trim();
    const install = installList[i]?.trim();
    const pat = patList[i]?.trim();
    const pot = potList[i]?.trim();

    if (!eq) continue;

    let linha = `${eq} - ${install} - ${pat}`;

    if (pot) {
      linha = `${eq} - ${install} - ${pot} - ${pat}`;
    }

    linhas.push(linha);
  }

  return linhas.join('\n');
}
