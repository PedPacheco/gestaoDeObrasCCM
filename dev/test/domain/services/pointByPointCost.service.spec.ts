import {
  PointByPointCostService,
  PointByPointServiceItem,
} from 'src/domain/services/pointByPointCost.service';

const item = (
  overrides: Partial<PointByPointServiceItem> = {},
): PointByPointServiceItem => ({
  idProg: 1,
  tipo: 'S',
  qtdeProgramada: 0,
  qtdeRealizada: 0,
  preco: 0,
  ...overrides,
});

describe('PointByPointCostService', () => {
  let service: PointByPointCostService;

  beforeEach(() => {
    service = new PointByPointCostService();
  });

  describe('calculate', () => {
    it('retorna zeros quando não há serviços', () => {
      expect(service.calculate([])).toEqual({ planejado: 0, executado: 0 });
    });

    it('calcula planejado e executado de um único serviço', () => {
      const result = service.calculate([
        item({ qtdeProgramada: 10, qtdeRealizada: 4, preco: 25 }),
      ]);

      expect(result).toEqual({ planejado: 250, executado: 100 });
    });

    it('soma vários serviços', () => {
      const result = service.calculate([
        item({ qtdeProgramada: 2, qtdeRealizada: 1, preco: 100 }),
        item({ qtdeProgramada: 3, qtdeRealizada: 3, preco: 50 }),
        item({ qtdeProgramada: 1, qtdeRealizada: 0, preco: 10 }),
      ]);

      expect(result.planejado).toBe(200 + 150 + 10);
      expect(result.executado).toBe(100 + 150 + 0);
    });

    it('executado fica zerado quando nada foi realizado', () => {
      const result = service.calculate([
        item({ qtdeProgramada: 5, qtdeRealizada: 0, preco: 20 }),
      ]);

      expect(result).toEqual({ planejado: 100, executado: 0 });
    });

    it('preço zero não gera valor', () => {
      const result = service.calculate([
        item({ qtdeProgramada: 5, qtdeRealizada: 5, preco: 0 }),
      ]);

      expect(result).toEqual({ planejado: 0, executado: 0 });
    });

    it('trata quantidades nulas ou indefinidas como zero (evita NaN)', () => {
      const result = service.calculate([
        item({
          qtdeProgramada: null as unknown as number,
          qtdeRealizada: undefined as unknown as number,
          preco: 10,
        }),
        item({ qtdeProgramada: 1, qtdeRealizada: 1, preco: 10 }),
      ]);

      expect(result).toEqual({ planejado: 10, executado: 10 });
    });

    it('suporta quantidades e preços decimais', () => {
      const result = service.calculate([
        item({ qtdeProgramada: 1.5, qtdeRealizada: 0.5, preco: 10.2 }),
      ]);

      expect(result.planejado).toBeCloseTo(15.3, 6);
      expect(result.executado).toBeCloseTo(5.1, 6);
    });

    it('não altera a lista recebida', () => {
      const input = [item({ qtdeProgramada: 1, qtdeRealizada: 1, preco: 5 })];
      const snapshot = JSON.parse(JSON.stringify(input));

      service.calculate(input);

      expect(input).toEqual(snapshot);
    });

    it('retorna um novo objeto a cada chamada', () => {
      const a = service.calculate([]);
      const b = service.calculate([]);

      expect(a).not.toBe(b);
    });
  });

  describe('groupByScheduleId', () => {
    it('retorna Map vazio para lista vazia', () => {
      const result = service.groupByScheduleId([]);

      expect(result).toBeInstanceOf(Map);
      expect(result.size).toBe(0);
    });

    it('agrupa serviços pelo idProg', () => {
      const a1 = item({ idProg: 1, preco: 1 });
      const a2 = item({ idProg: 1, preco: 2 });
      const b1 = item({ idProg: 2, preco: 3 });

      const result = service.groupByScheduleId([a1, b1, a2]);

      expect(result.size).toBe(2);
      expect(result.get(1)).toEqual([a1, a2]);
      expect(result.get(2)).toEqual([b1]);
    });

    it('mantém a ordem original dentro de cada grupo', () => {
      const items = [1, 2, 3, 4].map((preco) => item({ idProg: 9, preco }));

      const result = service.groupByScheduleId(items);

      expect(result.get(9)!.map((i) => i.preco)).toEqual([1, 2, 3, 4]);
    });

    it('retorna undefined para programação sem serviços', () => {
      const result = service.groupByScheduleId([item({ idProg: 1 })]);

      expect(result.get(999)).toBeUndefined();
    });

    it('preserva as referências dos itens (não clona)', () => {
      const original = item({ idProg: 5 });

      const result = service.groupByScheduleId([original]);

      expect(result.get(5)![0]).toBe(original);
    });

    it('não altera a lista de entrada', () => {
      const input = [item({ idProg: 1 }), item({ idProg: 2 })];
      const copy = [...input];

      service.groupByScheduleId(input);

      expect(input).toEqual(copy);
    });

    it('combina com calculate para obter o custo por programação', () => {
      const grouped = service.groupByScheduleId([
        item({ idProg: 1, qtdeProgramada: 2, qtdeRealizada: 1, preco: 10 }),
        item({ idProg: 1, qtdeProgramada: 1, qtdeRealizada: 1, preco: 10 }),
        item({ idProg: 2, qtdeProgramada: 4, qtdeRealizada: 0, preco: 5 }),
      ]);

      expect(service.calculate(grouped.get(1)!)).toEqual({
        planejado: 30,
        executado: 20,
      });
      expect(service.calculate(grouped.get(2)!)).toEqual({
        planejado: 20,
        executado: 0,
      });
    });
  });
});
