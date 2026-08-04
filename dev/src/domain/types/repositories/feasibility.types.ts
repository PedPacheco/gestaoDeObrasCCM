export type ExistsResponse = {
  id: number;
  id_obra: number;
  id_usuario: number;
  caminhos_arquivos: string[];
  aprovada: boolean;
  data_envio: Date;
  data_aprovacao: Date;
  id_usuario_aprovador: number;
  prazo_viabilidade: string;
};

export type GetRejectionsResponse = {
  descricao: string;
  motivo: string;
  criado_em: Date;
  novo_tabela_usuarios: { nome: string };
};
