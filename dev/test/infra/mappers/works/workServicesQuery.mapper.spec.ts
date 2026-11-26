import {
  toMaterialContract,
  toScheduleHistoryByIdSchedule,
  toSelectedService,
  toServiceByWorkId,
  toServiceToExport,
  toWorkToExport,
} from 'src/infra/mappers/works/services/workServicesQuery.mapper';

const dec = (n: number) => ({ toNumber: () => n }) as any;

describe('workServicesQuery.mapper', () => {
  describe('toServiceByWorkId', () => {
    it('converte o preço dos materiais para number', () => {
      const row: any = { id: 1, materiais: { id: 2, preco: dec(9.9) } };

      expect(toServiceByWorkId(row)).toEqual({
        id: 1,
        materiais: { id: 2, preco: 9.9 },
      });
    });
  });

  describe('toSelectedService', () => {
    it('converte materiais quando existem', () => {
      const row: any = {
        id: 1,
        servicos: { nome: 'S', materiais: { preco: dec(5) } },
      };

      expect(toSelectedService(row).servicos.materiais).toEqual({ preco: 5 });
    });

    it('retorna materiais null quando não existem', () => {
      const row: any = { id: 1, servicos: { nome: 'S', materiais: null } };

      expect(toSelectedService(row).servicos.materiais).toBeNull();
    });
  });

  describe('toScheduleHistoryByIdSchedule', () => {
    it('converte materiais quando existem', () => {
      const row: any = {
        id: 1,
        servicos: { materiais: { preco: dec(2) } },
      };

      expect(toScheduleHistoryByIdSchedule(row).servicos.materiais).toEqual({
        preco: 2,
      });
    });

    it('retorna materiais null quando não existem', () => {
      const row: any = { id: 1, servicos: { materiais: null } };

      expect(toScheduleHistoryByIdSchedule(row).servicos.materiais).toBeNull();
    });
  });

  describe('toMaterialContract', () => {
    it('converte o preço para number e preserva os demais campos', () => {
      const row: any = { id: 3, nome: 'M', preco: dec(7.25) };

      expect(toMaterialContract(row)).toEqual({
        id: 3,
        nome: 'M',
        preco: 7.25,
      });
    });
  });

  describe('toServiceToExport', () => {
    it('converte materiais quando existem', () => {
      const row: any = { id: 1, materiais: { preco: dec(4) } };

      expect(toServiceToExport(row).materiais).toEqual({ preco: 4 });
    });

    it('retorna materiais null quando não existem', () => {
      const row: any = { id: 1, materiais: null };

      expect(toServiceToExport(row).materiais).toBeNull();
    });
  });

  describe('toWorkToExport', () => {
    it('mapeia cada serviço da obra', () => {
      const row: any = {
        id: 1,
        servicos: [
          { id: 10, materiais: { preco: dec(1) } },
          { id: 11, materiais: null },
        ],
      };

      expect(toWorkToExport(row).servicos).toEqual([
        { id: 10, materiais: { preco: 1 } },
        { id: 11, materiais: null },
      ]);
    });

    it('retorna servicos null quando a obra não tem serviços', () => {
      const row: any = { id: 1, servicos: null };

      expect(toWorkToExport(row).servicos).toBeNull();
    });
  });
});
