import { TeamCounterService } from 'src/domain/services/teamCounter.service';

const service = (equipe: string) => ({ equipes: { equipe } });

describe('TeamCounterService', () => {
  describe('calculate', () => {
    describe('sem serviços', () => {
      it('usa os valores da própria programação quando programacoes_servicos é undefined', () => {
        const result = TeamCounterService.calculate({
          equipe_linha_morta: 2,
          equipe_linha_viva: 3,
          equipe_regularizacao: 4,
        });

        expect(result).toEqual({
          equipe_linha_morta: 2,
          equipe_linha_viva: 3,
          equipe_regularizacao: 4,
        });
      });

      it('usa os valores da programação quando a lista de serviços é vazia', () => {
        const result = TeamCounterService.calculate({
          programacoes_servicos: [],
          equipe_linha_morta: 1,
          equipe_linha_viva: 1,
          equipe_regularizacao: 1,
        });

        expect(result).toEqual({
          equipe_linha_morta: 1,
          equipe_linha_viva: 1,
          equipe_regularizacao: 1,
        });
      });

      it('assume 0 quando os campos da programação são null/undefined', () => {
        const result = TeamCounterService.calculate({
          programacoes_servicos: null,
          equipe_linha_morta: null,
        });

        expect(result).toEqual({
          equipe_linha_morta: 0,
          equipe_linha_viva: 0,
          equipe_regularizacao: 0,
        });
      });
    });

    describe('com serviços', () => {
      it('conta equipes LM, LV e NR distintas', () => {
        const result = TeamCounterService.calculate({
          programacoes_servicos: [
            service('LM-01'),
            service('LV-01'),
            service('NR-01'),
          ],
        });

        expect(result).toEqual({
          equipe_linha_morta: 1,
          equipe_linha_viva: 1,
          equipe_regularizacao: 1,
        });
      });

      it('não duplica a mesma equipe repetida em vários serviços', () => {
        const result = TeamCounterService.calculate({
          programacoes_servicos: [
            service('LM-01'),
            service('LM-01'),
            service('LM-02'),
          ],
        });

        expect(result.equipe_linha_morta).toBe(2);
      });

      it('trata equipes sem diferenciar maiúsculas/minúsculas', () => {
        const result = TeamCounterService.calculate({
          programacoes_servicos: [service('lm-01'), service('LM-01')],
        });

        expect(result.equipe_linha_morta).toBe(1);
      });

      it('ignora equipes que não contêm LM, LV ou NR', () => {
        const result = TeamCounterService.calculate({
          programacoes_servicos: [service('XX-01')],
        });

        expect(result).toEqual({
          equipe_linha_morta: 0,
          equipe_linha_viva: 0,
          equipe_regularizacao: 0,
        });
      });

      it('contabiliza uma equipe em mais de uma categoria quando o nome contém vários códigos', () => {
        const result = TeamCounterService.calculate({
          programacoes_servicos: [service('LM-LV-01')],
        });

        expect(result.equipe_linha_morta).toBe(1);
        expect(result.equipe_linha_viva).toBe(1);
      });
    });
  });
});
