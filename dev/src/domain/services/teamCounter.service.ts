export interface TeamCount {
  equipe_linha_morta: number;
  equipe_linha_viva: number;
  equipe_regularizacao: number;
}

export class TeamCounterService {
  static calculate(programacao: any): TeamCount {
    const services = programacao.programacoes_servicos;

    if (!services || services.length === 0) {
      return {
        equipe_linha_morta: programacao.equipe_linha_morta ?? 0,
        equipe_linha_viva: programacao.equipe_linha_viva ?? 0,
        equipe_regularizacao: programacao.equipe_regularizacao ?? 0,
      };
    }

    const lmSet = new Set<string>();
    const lvSet = new Set<string>();
    const regSet = new Set<string>();

    for (const service of services) {
      const equipe = service.equipes.equipe;

      const equipeUpper = equipe.toUpperCase();

      if (equipeUpper.includes('LM')) lmSet.add(equipeUpper);
      if (equipeUpper.includes('LV')) lvSet.add(equipeUpper);
      if (equipeUpper.includes('NR')) regSet.add(equipeUpper);
    }

    return {
      equipe_linha_morta: lmSet.size,
      equipe_linha_viva: lvSet.size,
      equipe_regularizacao: regSet.size,
    };
  }
}
