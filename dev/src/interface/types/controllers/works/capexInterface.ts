import type { GetAuxiliaryBaseMaterialsInterface } from 'src/domain/entities/capex.entity';

// Mantido por compatibilidade: o tipo agora vive em domain/entities/capex.entity.
export type { GetAuxiliaryBaseMaterialsInterface };

export interface materialsInterface {
  diagrama_rede: string;
  def_proj: string;
  material: string;
  texto_breve: string;
  centro: string;
  dep: string;
  cti: string;
  elemento_pep: string;
  und: string;
  preco: number;
  qtd_necessaria: number;
  qtd_retirada: number;
  qtd_falta: number;
  qtd_entrada: number;
  reserva: string;
}
