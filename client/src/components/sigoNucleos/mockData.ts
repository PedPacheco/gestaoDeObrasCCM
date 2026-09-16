/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Nucleo } from './types';

export const INITIAL_NUCLEOS: Nucleo[] = [];

export const REGIONAIS = [
  'São José dos Campos',
  'Mogi das Cruzes',
  'Guaratinguetá',
  'Guarulhos',
  'Litoral Norte'
];

export const MUNICIPIOS: Record<string, string[]> = {
  'São José dos Campos': [
    'SÃO JOSÉ DOS CAMPOS',
    'JACAREÍ',
    'CAÇAPAVA',
    'MONTEIRO LOBATO',
    'SANTA BRANCA',
    'JAMBEIRO'
  ],
  'Guaratinguetá': [
    'APARECIDA',
    'CACHOEIRA PAULISTA',
    'CANAS',
    'CRUZEIRO',
    'GUARATINGUETÁ',
    'LORENA',
    'PINDAMONHANGABA',
    'POTIM',
    'ROSEIRA',
    'TAUBATE',
    'TREMEMBE'
  ],
  'Mogi das Cruzes': [
    'MOGI DAS CRUZES',
    'BIRITIBA MIRIM',
    'SALESÓPOLIS',
    'GUARAREMA',
    'SUZANO',
    'POÁ',
    'ITAQUAQUECETUBA',
    'FERRAZ DE VASCONCELOS'
  ],
  'Guarulhos': [
    'GUARULHOS'
  ],
  'Litoral Norte': [
    'SÃO SEBASTIÃO',
    'CARAGUATATUBA'
  ]
};

export const TIPOS_REDE = ['FTTH', 'FTTC', 'HFC', 'Backbone', 'GPON Coaxial'];

export const TECNOLOGIAS = ['GPON', 'XGS-PON', 'XG-PON', 'HFC'];

export const STATUS_NUCLEO = [
  'Planejado',
  'Em Construção',
  'Pendente Regularização',
  'Ativo',
  'Aguardando Desativação',
  'Suspenso',
  'Concluído'
];

export const PARCEIRAS_SIGO = [
  'ENGELMIG',
  'OCA',
  'START VALE',
  'EDP',
  'START MCR',
  'LIG',
  'MONTELBRAS'
];

export const PARCEIRAS_RESPONSAVEIS = [
  'ENGELMIG',
  'OCA',
  'START VALE',
  'EDP',
  'START MCR',
  'LIG',
  'MONTELBRAS'
];

export const STATUS_RESTRIÇÃO = ['Liberado', 'Pendente', 'Em Análise', 'N/A'];

export const OPORTUNIDADES_CHI = ['Sim', 'Não', 'Em Análise'];

export const CONJUNTOS = [
  'ALEX SANFORD PETRASOLI',
  'APARECIDA',
  'ARARETAMA',
  'BARREIRO',
  'BIRITIBA',
  'BONSUCESSO',
  'BRAZ CUBAS',
  'CAÇAPAVA',
  'CACHOEIRA PAULISTA',
  'CESAR DE SOUZA',
  'CRUZEIRO',
  'CUMBICA',
  'DUTRA',
  'FERRAZ DE VASCONCELOS',
  'GOPOUVA',
  'GUARAREMA',
  'GUARATINGUETA',
  'GUARULHOS',
  'INDEPENDENCIA',
  'IPORANGA',
  'ITAQUAQUECETUBA',
  'JACAREI',
  'JOAO NOVAES',
  'JOSE CENTRO',
  'LORENA',
  'MANTIQUEIRA',
  'MOGI CIDADE',
  'PARQUE INDUSTRIAL',
  'PARQUE TECNOLÓGICO',
  'PEDREIRA',
  'PIMENTAS',
  'PINDAMONHANGABA',
  'POA',
  'SAO JOSE DOS CAMPOS',
  'SAO LUIS',
  'SATÉLITE',
  'SUZANO',
  'TAUBATE',
  'URBANOVA',
  'VALE DO SOL',
  'VALTER JOSE DOS SANTOS',
  'VILA GALVAO',
  'VILA HERMINIA',
  'NÃO DEFINIDO',
  'BOISSUCANGA',
  'CARAGUA',
  'JUQUEI',
  'MASSAGUACU',
  'OLARIA',
  'PORTO NOVO',
  'ROSEIRA',
  'SANTA LUZIA',
  'SAO SEBASTIAO',
  'GERMANA',
  'FERRAZ',
  'COLORADO',
  'DONA BENTA',
  'SANTA PAULA',
  'KIDA MACEDO',
  'ROTARY',
  'MANSERV',
  'ELETROREDE',
  'HR4',
  'COMPEL',
  'COSAMPA'
];
