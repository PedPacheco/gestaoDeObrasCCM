import {
  convertParameterValue,
  convertParameterValueForArray,
} from 'src/utils/convertParameterValue';

describe('convertParameterValue', () => {
  it('converte lista separada por vírgula em números', () => {
    expect(convertParameterValue('1,2,3')).toEqual([1, 2, 3]);
  });

  it('descarta itens vazios', () => {
    expect(convertParameterValue('1,,3,')).toEqual([1, 3]);
  });

  it('retorna [] para string vazia', () => {
    expect(convertParameterValue('')).toEqual([]);
  });

  it('retorna [] para valor falsy (undefined)', () => {
    expect(convertParameterValue(undefined as any)).toEqual([]);
  });

  it('retorna NaN para itens não numéricos', () => {
    expect(convertParameterValue('a')).toEqual([NaN]);
  });
});

describe('convertParameterValueForArray', () => {
  it('converte lista separada por vírgula em strings', () => {
    expect(convertParameterValueForArray('a,b,c')).toEqual(['a', 'b', 'c']);
  });

  it('descarta itens vazios', () => {
    expect(convertParameterValueForArray('a,,c')).toEqual(['a', 'c']);
  });

  it('retorna [] para string vazia', () => {
    expect(convertParameterValueForArray('')).toEqual([]);
  });

  it('retorna [] para valor falsy (undefined)', () => {
    expect(convertParameterValueForArray(undefined as any)).toEqual([]);
  });
});
