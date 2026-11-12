// src/domain/constants/d5Notes/motivosD5.ts
export const REASONS_D5 = {
  1: 'Falta de Materiais',
  2: 'Reparo Passeio',
  3: 'Aterramento',
  4: 'Inventário',
  5: 'Pendência de Poda',
  6: 'Projeto',
  7: 'Chave',
  8: 'Condutor',
  9: 'Conexão',
  10: 'Equipamento',
  11: 'Estrutura/Poste',
  12: 'Isolador/Cadeia',
  13: 'Padrão de Entrada',
  14: 'Para-raios',
  15: 'Sinalização',
  16: 'Outros',
  17: 'Compartilhante',
  18: 'Penalidades',
} as const;

export const REASONS_D5_OPTIONS = Object.entries(REASONS_D5).map(
  ([id, nome]) => ({ id: Number(id), nome }),
);

export const mapMotivosD5 = (codigos?: number[] | null) =>
  (codigos ?? [])
    .filter((id) => id in REASONS_D5)
    .map((id) => REASONS_D5[id as keyof typeof REASONS_D5]);
