/**
 * Leitura da tabela de textos partilhados (xl/sharedStrings.xml) de um .xlsx.
 *
 * O leitor em streaming do ExcelJS só resolve os textos se encontrar o
 * sharedStrings.xml antes da folha, e com o caminho exato que espera.
 * Exportações do SAP gravam a folha primeiro, e as células de texto chegam
 * como { sharedString: n }. Esta 1.ª passagem lê a tabela diretamente do ZIP,
 * independentemente da ordem das entradas.
 *
 * Arquivo SEM dependências do Nest nem de imports "src/...": é executado
 * dentro de um worker_thread, onde o alias de paths não existe.
 */
import JSZip from 'jszip';
import { readFile } from 'node:fs/promises';
import { SaxesParser } from 'saxes';

/** Aceita "xl/sharedStrings.xml", "/xl/sharedstrings.xml", etc. */
const SHARED_STRINGS_PATH = /(^|\/)xl\/sharedstrings\.xml$/i;

type SharedStringRef = { sharedString: number };

export function isSharedStringRef(value: unknown): value is SharedStringRef {
  return (
    value !== null &&
    typeof value === 'object' &&
    typeof (value as SharedStringRef).sharedString === 'number'
  );
}

/** Remove o prefixo de namespace (ex.: "x:si" -> "si"). */
const localName = (name: string): string => name.replace(/^.*:/, '');

/**
 * Converte o XML da tabela de textos numa lista, pela ordem dos <si>.
 * Rich text (<r><t>) é concatenado; textos fonéticos (<rPh>) são ignorados.
 */
export function parseSharedStringsXml(xml: string): string[] {
  const parser = new SaxesParser();
  const strings: string[] = [];

  let current: string | null = null;
  let inText = false;
  let phoneticDepth = 0;

  const appendText = (text: string) => {
    if (inText && current !== null) current += text;
  };

  parser.on('opentag', (tag) => {
    switch (localName(tag.name)) {
      case 'si':
        current = '';
        break;
      case 'rPh':
        phoneticDepth++;
        break;
      case 't':
        inText = phoneticDepth === 0;
        break;
    }
  });

  parser.on('text', appendText);
  parser.on('cdata', appendText);

  parser.on('closetag', (tag) => {
    switch (localName(tag.name)) {
      case 't':
        inText = false;
        break;
      case 'rPh':
        phoneticDepth--;
        break;
      case 'si':
        strings.push(current ?? '');
        current = null;
        break;
    }
  });

  parser.on('error', (error) => {
    throw new Error(`sharedStrings.xml inválido: ${error.message}`);
  });

  parser.write(xml).close();
  return strings;
}

/** 1.ª passagem: devolve a tabela de textos ([] se a planilha não tiver textos). */
export async function loadSharedStrings(filePath: string): Promise<string[]> {
  const zip = await JSZip.loadAsync(await readFile(filePath));

  const entry = Object.values(zip.files).find(
    (file) => !file.dir && SHARED_STRINGS_PATH.test(file.name),
  );
  if (!entry) return [];

  return parseSharedStringsXml(await entry.async('string'));
}

/**
 * Substitui { sharedString: n } pelo texto da tabela.
 * Valores já resolvidos pelo ExcelJS (texto, números, datas) não são alterados.
 */
export function resolveSharedStrings(
  values: readonly unknown[],
  shared: readonly string[],
): unknown[] {
  return values.map((value) =>
    isSharedStringRef(value) ? (shared[value.sharedString] ?? null) : value,
  );
}
