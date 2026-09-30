import { Dayjs } from "dayjs";

export type FilterOption = { id: string; [key: string]: any };

// Index signature adicionada para refletir o uso real do tipo: o valor é
// tratado como um dicionário dinâmico em vários lugares (ex.: iteração via
// `Object.entries` nos componentes de filtro), então o tipo precisa admitir
// isso — sem ela, qualquer função tipada com `Record<string, any[]>` (como
// GenericFilterBar) exige cast na borda para aceitar este objeto.
export interface FiltersInterface {
  [key: string]: { id: string; [key: string]: any }[] | undefined;

  regional?: { id: string; regional: string }[];
  parceira?: { id: string; turma: string }[];
  tipo?: { id: string; tipo_obra: string; id_grupo: number }[];
  municipio?: { id: string; municipio: string; id_regional: number }[];
  grupo?: { id: string; grupo: string }[];
  status?: { id: string; status: string }[];
  statusSap?: { id: string; codigo_sap: string }[];
  circuito?: { id: string; circuito: string }[];
  empreendimento?: {
    id: string;
    empreendimento: string;
    id_regional: number;
    id_grupo: number;
  }[];
  conjunto?: { id: string; conjunto: string }[];
  notaD5?: { id: string; nota_d5: string }[];
}

/**
 * Schema declarativo de filtros. Cada tela (D5, Obras, etc.) descreve seus
 * campos aqui em vez de duplicar JSX de <TextField>/<DatePicker>/<MultipleSelect>.
 */
export type FilterFieldConfig =
  | SelectFilterConfig
  | DateRangeFilterConfig
  | TextFilterConfig
  | OptionsFilterConfig;

export interface SelectFilterConfig {
  type: "select";
  /** Chave em `data` de onde vêm as opções (ex.: "regional", "grupo") */
  dataKey: string;
  /**
   * Chave usada em `selectedItems` e enviada ao backend (ex.: "idRegional").
   * Antes essa chave era inferida a partir da ordem das propriedades do
   * primeiro item do array (`Object.keys(value[0])[0]`), o que quebra
   * silenciosamente se o backend mudar a ordem de serialização do JSON.
   * Tornar isso explícito no schema remove essa fragilidade.
   */
  filterKey: string;
  /** Rótulo exibido. Se omitido, usa `capitalize(dataKey)` */
  label?: string;
  /** Chave do valor dentro de cada item do array (ex.: "id_regional") */
  valueKey: string;
  /** Chave exibida ao usuário dentro de cada item do array (ex.: "nome") */
  displayKey: string;
  virtualized?: boolean; // 👈
}

export interface DateRangeFilterConfig {
  type: "dateRange";
  /** Prefixo usado para gerar `${key}Inicial` e `${key}Final` */
  key: string;
  label: string;
  /** Desabilita o range com base nos outros valores extras já selecionados */
  disabledWhen?: (extraValues: Record<string, string>) => boolean;
  /** Ao desabilitar, os valores são limpos automaticamente (default: true) */
  clearWhenDisabled?: boolean;
}

export interface TextFilterConfig {
  type: "text";
  key: string;
  label: string;
  inputMode?: "numeric" | "text";
  /** Ex.: remover não-dígitos */
  sanitize?: (value: string) => string;
}

export interface OptionsFilterConfig {
  type: "options";
  key: string;
  label: string;
  options: readonly string[];
  allLabel?: string; // default: "Todos"
}

export type ExtraFilterValue = string | Dayjs | null;
