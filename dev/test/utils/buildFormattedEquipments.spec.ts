import { buildEquipamentosFormatados } from 'src/utils/buildFormattedEquipments';

describe('buildEquipamentosFormatados', () => {
  it('should return null when required params are missing', () => {
    expect(buildEquipamentosFormatados()).toBeNull();
    expect(
      buildEquipamentosFormatados('inst', undefined, undefined, 'pat'),
    ).toBeNull();
    expect(
      buildEquipamentosFormatados(undefined, 'eq', undefined, 'pat'),
    ).toBeNull();
    expect(
      buildEquipamentosFormatados('inst', 'eq', undefined, undefined),
    ).toBeNull();
  });

  it('should format correctly without potencias', () => {
    const result = buildEquipamentosFormatados(
      'I1;I2',
      'E1;E2',
      undefined,
      'P1;P2',
    );

    expect(result).toBe(
      'Equipamento - Instalação - Potência/Marca CS - Patrimônio\n\n' +
        'E1 - I1 - P1\n' +
        'E2 - I2 - P2',
    );
  });

  it('should format correctly with potencias', () => {
    const result = buildEquipamentosFormatados(
      'I1;I2',
      'E1;E2',
      'PO1;PO2',
      'P1;P2',
    );

    expect(result).toBe(
      'Equipamento - Instalação - Potência/Marca CS - Patrimônio\n\n' +
        'E1 - I1 - PO1 - P1\n' +
        'E2 - I2 - PO2 - P2',
    );
  });

  it('should ignore empty equipamentos', () => {
    const result = buildEquipamentosFormatados('I1;I2', 'E1;', 'PO1;', 'P1;P2');

    expect(result).toBe(
      'Equipamento - Instalação - Potência/Marca CS - Patrimônio\n\n' +
        'E1 - I1 - PO1 - P1',
    );
  });

  it('should handle different list sizes safely', () => {
    const result = buildEquipamentosFormatados('I1', 'E1;E2', 'PO1', 'P1;P2');

    expect(result).toBe(
      'Equipamento - Instalação - Potência/Marca CS - Patrimônio\n\n' +
        'E1 - I1 - PO1 - P1\n' +
        'E2 - undefined - P2',
    );
  });

  it('should trim values correctly', () => {
    const result = buildEquipamentosFormatados(
      ' I1 ; I2 ',
      ' E1 ; E2 ',
      ' PO1 ; PO2 ',
      ' P1 ; P2 ',
    );

    expect(result).toBe(
      'Equipamento - Instalação - Potência/Marca CS - Patrimônio\n\n' +
        'E1 - I1 - PO1 - P1\n' +
        'E2 - I2 - PO2 - P2',
    );
  });

  it('should skip linhas where equipamento is empty', () => {
    const result = buildEquipamentosFormatados(
      'I1;I2',
      ';E2',
      'PO1;PO2',
      'P1;P2',
    );

    expect(result).toBe(
      'Equipamento - Instalação - Potência/Marca CS - Patrimônio\n\n' +
        'E2 - I2 - PO2 - P2',
    );
  });

  it('should handle empty potencias gracefully', () => {
    const result = buildEquipamentosFormatados('I1', 'E1', '', 'P1');

    expect(result).toBe(
      'Equipamento - Instalação - Potência/Marca CS - Patrimônio\n\n' +
        'E1 - I1 - P1',
    );
  });
});
