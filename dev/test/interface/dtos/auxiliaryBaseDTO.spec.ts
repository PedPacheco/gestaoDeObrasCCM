import 'reflect-metadata';

import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  InsertBaseAuxiliaryMarketDTO,
  InsertBaseAuxiliaryNotesDTO,
  NotesDTO,
} from 'src/interface/dtos/auxiliaryBaseDTO';
import {
  InsertMarketWorksDTO,
  InsertNotesDTO,
} from 'src/interface/dtos/worksDto';

describe('DTO Validations', () => {
  const expectValid = async (dtoInstance: any) => {
    const errors = await validate(dtoInstance);
    expect(errors.length).toBe(0);
  };

  const expectInvalid = async (dtoInstance: any) => {
    const errors = await validate(dtoInstance);
    expect(errors.length).toBeGreaterThan(0);
  };

  describe('InsertBaseAuxiliaryMarketDTO', () => {
    it('should be valid', async () => {
      const dto = plainToInstance(InsertBaseAuxiliaryMarketDTO, {
        obra: '123',
        pep: 'pep01',
        diagrama: 'diag1',
        entrada: new Date(),
        gpm: 'gpm1',
        tipo: 'tipo1',
        circuito: 'C1',
        prazoTexto: 'prazo',
        statusOv: 1,
        statusDiagrama: 'ativo',
        statusPep: 'ativo',
        equipeNumPedido: '123456',
        moCliente: 100,
        moEmpresa: 200,
      });

      await expectValid(dto);
    });

    it('should be invalid without required fields', async () => {
      const dto = new InsertBaseAuxiliaryMarketDTO();
      await expectInvalid(dto);
    });
  });

  describe('InsertMarketWorksDTO', () => {
    it('should be valid', async () => {
      const dto = plainToInstance(InsertMarketWorksDTO, {
        obra: '123',
        pep: 'pep01',
        diagrama: 'diag1',
        entrada: new Date(),
        idMunicipio: 1,
        idTipo: 2,
        idCircuito: 3,
        prazoTexto: 'prazo',
        statusOv: 1,
        statusDiagrama: 'ativo',
        statusPep: 'ativo',
        equipeNumPedido: '321',
        moCliente: 100,
        moEmpresa: 200,
        observacao: 'nada a declarar',
        idParceira: 5,
      });

      await expectValid(dto);
    });

    it('should be invalid with missing fields', async () => {
      const dto = new InsertMarketWorksDTO();
      await expectInvalid(dto);
    });
  });

  describe('NotesDTO', () => {
    it('should be valid', async () => {
      const dto = plainToInstance(NotesDTO, {
        campo_ordenacao: 'campo',
        pep: 'pep01',
        ordem_dci: 'ord1',
        ordem_dcd: 'ord2',
        ordem_dca: 'ord3',
        ordem_dcim: 'ord4',
        conjunto: 'conj1',
        texto_breve: 'texto',
        grp_plnj_pm: 'gpm',
        denominacao: 'denom',
      });

      await expectValid(dto);
    });
  });

  describe('InsertBaseAuxiliaryNotesDTO', () => {
    it('should be valid', async () => {
      const dto = plainToInstance(InsertBaseAuxiliaryNotesDTO, {
        notesData: {
          campo_ordenacao: 'campo',
          pep: 'pep01',
          ordem_dci: 'ord1',
          ordem_dcd: 'ord2',
          ordem_dca: 'ord3',
          ordem_dcim: 'ord4',
          conjunto: 'conj1',
          texto_breve: 'texto',
          grp_plnj_pm: 'gpm',
          denominacao: 'denom',
        },
        materialData: [
          {
            diagrama_rede: 'DR1',
            ctg_item: 'item1',
            um_registro: 'un',
            texto_material: 'material',
            qtd_necess: 10,
            preco_mi: 200,
            material: 'MAT01',
            def_proj: 'def1',
          },
        ],
      });

      await expectValid(dto);
    });
  });

  describe('InsertNotesDTO', () => {
    it('should be valid', async () => {
      const dto = plainToInstance(InsertNotesDTO, {
        obra: '123',
        entrada: new Date(),
        prazo: 'curto',
        referencia: 'ref01',
        aux_gpm: 1,
        aux_empreendimento: 2,
        aux_tipo: 3,
        aux_turma: 4,
        aux_circuito: 5,
        aux_tecnico: 6,
        anoplan: 2025,
      });

      await expectValid(dto);
    });

    it('should be invalid if required fields missing', async () => {
      const dto = new InsertNotesDTO();
      await expectInvalid(dto);
    });
  });
});
