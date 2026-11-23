import {
  mapMotivosD5,
  REASONS_D5,
  REASONS_D5_OPTIONS,
} from 'src/domain/constants/d5Notes/reasonsD5';

describe('reasonsD5', () => {
  describe('REASONS_D5_OPTIONS', () => {
    it('contém uma opção para cada motivo', () => {
      expect(REASONS_D5_OPTIONS).toHaveLength(Object.keys(REASONS_D5).length);
    });

    it('converte o id para number e mantém o nome', () => {
      expect(REASONS_D5_OPTIONS[0]).toEqual({
        id: 1,
        nome: 'Falta de Materiais',
      });
      expect(REASONS_D5_OPTIONS.at(-1)).toEqual({
        id: 18,
        nome: 'Penalidades',
      });
    });
  });

  describe('mapMotivosD5', () => {
    it('mapeia códigos válidos para os nomes', () => {
      expect(mapMotivosD5([1, 3, 16])).toEqual([
        'Falta de Materiais',
        'Aterramento',
        'Outros',
      ]);
    });

    it('descarta códigos inexistentes', () => {
      expect(mapMotivosD5([1, 99, 0])).toEqual(['Falta de Materiais']);
    });

    it('retorna lista vazia para null, undefined ou array vazio', () => {
      expect(mapMotivosD5(null)).toEqual([]);
      expect(mapMotivosD5(undefined)).toEqual([]);
      expect(mapMotivosD5([])).toEqual([]);
    });

    it('preserva a ordem e duplicidades recebidas', () => {
      expect(mapMotivosD5([3, 1, 3])).toEqual([
        'Aterramento',
        'Falta de Materiais',
        'Aterramento',
      ]);
    });
  });
});
