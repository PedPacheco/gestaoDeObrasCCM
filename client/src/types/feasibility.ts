export interface FeasibilityDataInterface {
  id: number;
  id_obra: number;
  id_usuario: number;
  caminhos_arquivos: string[];
  arquivos_complementares: string[];
  aprovada: boolean;
  data_envio: string | null;
  data_aprovacao: string | null;
  id_usuario_aprovador: number | null;
  prazo_viabilidade: string;
}

export interface DisplayFile {
  name: string;
  size: number | null;
  raw?: File;
}
