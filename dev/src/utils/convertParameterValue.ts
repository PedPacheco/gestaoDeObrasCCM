export function convertParameterValue(param: string) {
  return param && param !== ''
    ? param
        .toString()
        .split(',')
        .filter((v: string) => v !== '')
        .map(Number)
    : [];
}

export function convertParameterValueForArray(param: string) {
  return param && param !== ''
    ? param
        .toString()
        .split(',')
        .filter((v: string) => v !== '')
    : [];
}
