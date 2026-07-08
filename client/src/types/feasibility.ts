export interface ExistingFile {
  id: number;
  id_obra: number;
  caminho_arquivo: string;
  id_usuario: number;
}

export interface DisplayFile {
  name: string;
  size: number | null;
  raw?: File;
  remoteId?: number;
}
