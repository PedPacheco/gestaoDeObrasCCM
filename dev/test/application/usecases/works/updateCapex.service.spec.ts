import { UpdateCapexService } from 'src/application/usecases/works/updateCapex.service';

describe('UpdateCapexService', () => {
  let service: UpdateCapexService;

  const auxiliaryBaseRepository = {
    getAuxiliaryBaseCN52N: jest.fn(),
    getFator: jest.fn(),
  };

  const updateCapexRepository = {
    getDeletedMaterials: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new UpdateCapexService(
      auxiliaryBaseRepository as any,
      updateCapexRepository as any,
    );
  });

  // ============================================================
  // 🧩 TESTES DO UPDATE (ORQUESTRAÇÃO)
  // ============================================================

  describe('update', () => {
    it('deve executar o fluxo completo com sucesso', async () => {
      const mockMaterials = [
        {
          id_obra: 1,
          material: 'MAT1',
          def_proj: 'P1',
          qtd_necessaria: 10,
          qtd_retirada: 5,
          qtd_recebida: 3,
          qtd_falta: 2,
          preco: 100,
          reserva: 'X',
          cti: 'N',
          diagrama_rede: '170123',
          elemento_pep: 'XXX-2',
        },
      ];

      auxiliaryBaseRepository.getAuxiliaryBaseCN52N.mockResolvedValue(
        mockMaterials,
      );
      auxiliaryBaseRepository.getFator.mockResolvedValue(
        new Map([['MAT1|P1', 2]]),
      );
      updateCapexRepository.getDeletedMaterials.mockResolvedValue([
        { material: 'MAT1' },
      ]);
      updateCapexRepository.update.mockResolvedValue(undefined);

      const progressMock = jest.fn();

      await service.update(progressMock);

      expect(auxiliaryBaseRepository.getAuxiliaryBaseCN52N).toHaveBeenCalled();
      expect(auxiliaryBaseRepository.getFator).toHaveBeenCalled();
      expect(updateCapexRepository.getDeletedMaterials).toHaveBeenCalled();
      expect(updateCapexRepository.update).toHaveBeenCalled();

      expect(progressMock).toHaveBeenCalled();
    });

    it('deve funcionar sem onProgress', async () => {
      auxiliaryBaseRepository.getAuxiliaryBaseCN52N.mockResolvedValue([]);
      auxiliaryBaseRepository.getFator.mockResolvedValue(new Map());
      updateCapexRepository.getDeletedMaterials.mockResolvedValue([]);
      updateCapexRepository.update.mockResolvedValue(undefined);

      await expect(service.update()).resolves.not.toThrow();
    });

    it('deve emitir erro no onProgress e relançar exceção', async () => {
      auxiliaryBaseRepository.getAuxiliaryBaseCN52N.mockRejectedValue(
        new Error('Erro teste'),
      );

      const progressMock = jest.fn();

      await expect(service.update(progressMock)).rejects.toThrow('Erro teste');

      expect(progressMock).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'error',
        }),
      );
    });

    it('deve emitir erro no onProgress e relançar exceção com mensagem padrão', async () => {
      const error = new Error();
      (error as any).message = undefined;

      auxiliaryBaseRepository.getAuxiliaryBaseCN52N.mockRejectedValue(error);

      const progressMock = jest.fn();

      await expect(service.update(progressMock)).rejects.toThrow();

      expect(progressMock).toHaveBeenCalledWith(
        expect.objectContaining({
          phase: 'error',
          message: 'Erro desconhecido na atualização do CAPEX',
        }),
      );
    });
  });

  // ============================================================
  // 🧠 TESTES DE HELPERS
  // ============================================================

  describe('extractAllMaterials', () => {
    it('deve extrair material e pep_ref corretamente', () => {
      const input = [{ material: 'MAT1', def_proj: 'P1' }];

      const result = (service as any).extractAllMaterials(input);

      expect(result).toEqual([{ material: 'MAT1', pep_ref: 'P1' }]);
    });
  });

  describe('canIncludeCapex', () => {
    it('deve retornar false se diagrama for vazio', () => {
      const result = (service as any).canIncludeCapex('');

      expect(result).toBe(false);
    });

    it('deve validar prefixos padrão', () => {
      const result = (service as any).canIncludeCapex('170123');

      expect(result).toBe(true);
    });

    it('deve validar regra especial do prefixo 200 com elemento_pep', () => {
      const result = (service as any).canIncludeCapex('200123', 'ABC-2');

      expect(result).toBe(true);
    });

    it('deve falhar regra do 200 sem -2', () => {
      const result = (service as any).canIncludeCapex('200123', 'ABC-1');

      expect(result).toBe(false);
    });
  });

  // ============================================================
  // 🔥 TESTES DO CORE (calculateCapexValues)
  // ============================================================

  describe('calculateCapexValues', () => {
    it('deve calcular corretamente todos os campos', () => {
      const materials = [
        {
          id_obra: 1,
          material: 'MAT1',
          def_proj: 'P1',
          qtd_necessaria: 10,
          qtd_retirada: 5,
          qtd_recebida: 3,
          qtd_falta: 2,
          preco: 100,
          reserva: 'X',
          cti: 'N',
          diagrama_rede: '170123',
          elemento_pep: 'XXX-2',
        },
      ];

      const fatorMap = new Map([['MAT1|P1', 2]]);
      const deleted = [{ material: 'MAT1' }];

      const result = (service as any).calculateCapexValues(
        materials,
        fatorMap,
        deleted,
      );

      expect(result).toHaveLength(1);

      const item = result[0];

      expect(item.qtde_calc).toBe(5);
      expect(item.qtde_pend).toBe(2.5);
      expect(item.mo_calc).toBe(1000);
      expect(item.mo_exec).toBe(300);
      expect(item.mo_pend).toBe(200);
      expect(item.capex_mo_plan).toBe(1000);
      expect(item.capex_mo_pend).toBe(200);
    });

    it('deve ignorar materiais sem id_obra', () => {
      const result = (service as any).calculateCapexValues(
        [{ material: 'MAT1' }],
        new Map(),
        [],
      );

      expect(result).toHaveLength(0);
    });

    it('deve lidar com fator inexistente', () => {
      const materials = [
        {
          id_obra: 1,
          material: 'MAT1',
          def_proj: 'P1',
          qtd_necessaria: 10,
        },
      ];

      const result = (service as any).calculateCapexValues(
        materials,
        new Map(),
        [],
      );

      expect(result[0].qtde_calc).toBe(0);
    });

    it('deve calcular capex de material (cti = L)', () => {
      const materials = [
        {
          id_obra: 1,
          material: 'MAT1',
          def_proj: 'P1',
          qtd_necessaria: 10,
          qtd_retirada: 5,
          preco: 100,
          reserva: 'X',
          cti: 'L',
          diagrama_rede: '170123',
        },
      ];

      const result = (service as any).calculateCapexValues(
        materials,
        new Map(),
        [],
      );

      expect(result[0].capex_mat_plan).toBe(1000);
      expect(result[0].capex_mat_pend).toBe(500);
    });

    it('deve não incluir capex quando não permitido', () => {
      const materials = [
        {
          id_obra: 1,
          material: 'MAT1',
          def_proj: 'P1',
          qtd_necessaria: 10,
          preco: 100,
          cti: 'L',
          diagrama_rede: '999999',
        },
      ];

      const result = (service as any).calculateCapexValues(
        materials,
        new Map(),
        [],
      );

      expect(result[0].capex_mat_plan).toBe(0);
    });

    it('deve ignorar materiais com reserva inexistente', () => {
      jest.spyOn(service as any, 'canIncludeCapex').mockReturnValue(true);

      const materials = [
        {
          id_obra: 1,
          material: 'MAT1',
          def_proj: 'P1',
          qtd_necessaria: 10,
          preco: 100,
          cti: 'L',
          diagrama_rede: '170000',
          reserva: null,

          // 🔥 CAMPOS NECESSÁRIOS
          qtd_retirada: 5,
          qtd_recebida: 5,
          qtd_falta: 5,
          elemento_pep: 'X',
        },
        {
          id_obra: 1,
          material: 'MAT1',
          def_proj: 'P1',
          qtd_necessaria: 10,
          preco: 100,
          cti: 'N',
          diagrama_rede: '170000',
          reserva: null,

          qtd_retirada: 5,
          qtd_recebida: 5,
          qtd_falta: 5,
          elemento_pep: 'X',
        },
      ];

      const result = (service as any).calculateCapexValues(
        materials,
        new Map([['MAT1|P1', 2]]),
        [{ material: 'MAT1' }],
      );

      const item = result[0];

      // 🔥 NÃO deve entrar nos blocos com reserva
      expect(item.qtde_pend).toBe(0);
      expect(item.capex_mat_pend).toBe(0);
      expect(item.capex_mo_pend).toBe(0);

      // 🔥 MAS deve calcular os planos
      expect(item.capex_mat_plan).toBeGreaterThan(0);
      expect(item.capex_mo_plan).toBeGreaterThan(0);
    });
  });
});
