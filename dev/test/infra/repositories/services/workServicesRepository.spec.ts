import { Test, TestingModule } from '@nestjs/testing';
import {
  ImportServiceItem,
  SchedulesProgressUpdate,
} from 'src/domain/repositories/worksService/IWorkServicesRepository';
import {
  DEMOTED_WORK_STATUS,
  ServiceTotals,
} from 'src/domain/services/pointByPointRules.service';
import { Prisma } from 'src/generated/prisma/client';
import { WorkServicesRepository } from 'src/infra/repositories/worksServices/worksServicesRepository';
import {
  AddServicesDTO,
  ApplyAdditonalDTO,
  ScheduleServicesDTO,
} from 'src/interface/dtos/workServicesDTO';

// ─── Helpers ─────────────────────────────────────────────────────────
const buildTx = () => ({
  programacoes: {
    update: jest.fn(),
    findUnique: jest.fn(),
  },
  programacoes_servicos: {
    createMany: jest.fn(),
    findMany: jest.fn(),
    deleteMany: jest.fn(),
  },
  servicos: {
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
  },
  relatorio: {
    deleteMany: jest.fn(),
    upsert: jest.fn(),
  },
  obras: {
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  $executeRaw: jest.fn(),
});

type TxMock = ReturnType<typeof buildTx>;

const asTx = (tx: TxMock) => tx as unknown as Prisma.TransactionClient;

/** Reconstrói a query enviada ao $executeRaw (tagged template) num Prisma.Sql */
const getRawQuery = (tx: TxMock, call = 0): Prisma.Sql => {
  const [strings, ...values] = tx.$executeRaw.mock.calls[call];
  return Prisma.sql(strings, ...values);
};

const normalize = (sql: string) => sql.replace(/\s+/g, ' ').trim();

describe('WorkServicesRepository', () => {
  let repository: WorkServicesRepository;
  let tx: TxMock;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WorkServicesRepository],
    }).compile();

    repository = module.get(WorkServicesRepository);
    tx = buildTx();
  });

  afterEach(jest.clearAllMocks);

  it('should be defined', () => {
    expect(repository).toBeDefined();
  });

  // ─── Programação de itens ──────────────────────────────────────────
  describe('updateScheduleStatus', () => {
    it('should update status and clear reprovada flag', async () => {
      await repository.updateScheduleStatus(3, 2, asTx(tx));

      expect(tx.programacoes.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { id_status_programacao: 2, reprovada: false },
      });
    });

    it('should propagate prisma errors', async () => {
      tx.programacoes.update.mockRejectedValueOnce(new Error('not found'));

      await expect(
        repository.updateScheduleStatus(3, 2, asTx(tx)),
      ).rejects.toThrow('not found');
    });
  });

  describe('createScheduleItems', () => {
    it('should map DTOs to programacoes_servicos rows', async () => {
      const data = [
        { id: 10, idTeam: 1, prog: 5, additional: 0 },
        { id: 11, idTeam: 2, prog: 7.5, additional: 2 },
      ] as ScheduleServicesDTO[];

      await repository.createScheduleItems(3, data, asTx(tx));

      expect(tx.programacoes_servicos.createMany).toHaveBeenCalledTimes(1);
      expect(tx.programacoes_servicos.createMany).toHaveBeenCalledWith({
        data: [
          {
            id_programacao: 3,
            id_servico: 10,
            id_equipe: 1,
            prog: 5,
            adicional: 0,
          },
          {
            id_programacao: 3,
            id_servico: 11,
            id_equipe: 2,
            prog: 7.5,
            adicional: 2,
          },
        ],
      });
    });

    it('should not leak extra DTO fields into the row', async () => {
      const data = [
        { id: 10, idTeam: 1, prog: 5, additional: 0, foo: 'bar' },
      ] as unknown as ScheduleServicesDTO[];

      await repository.createScheduleItems(3, data, asTx(tx));

      const [row] = tx.programacoes_servicos.createMany.mock.calls[0][0].data;
      expect(Object.keys(row).sort()).toEqual(
        [
          'adicional',
          'id_equipe',
          'id_programacao',
          'id_servico',
          'prog',
        ].sort(),
      );
    });

    it('should call createMany with empty data when no items are given', async () => {
      await repository.createScheduleItems(3, [], asTx(tx));

      expect(tx.programacoes_servicos.createMany).toHaveBeenCalledWith({
        data: [],
      });
    });
  });

  describe('updateServicesAdditional', () => {
    it('should update qtde_adicional of each service', async () => {
      await repository.updateServicesAdditional(
        [
          { id: 1, additional: 3 },
          { id: 2, additional: 0 },
        ],
        asTx(tx),
      );

      expect(tx.servicos.update).toHaveBeenCalledTimes(2);
      expect(tx.servicos.update).toHaveBeenNthCalledWith(1, {
        where: { id: 1 },
        data: { qtde_adicional: 3 },
      });
      expect(tx.servicos.update).toHaveBeenNthCalledWith(2, {
        where: { id: 2 },
        data: { qtde_adicional: 0 },
      });
    });

    it('should not call prisma when list is empty', async () => {
      await repository.updateServicesAdditional([], asTx(tx));

      expect(tx.servicos.update).not.toHaveBeenCalled();
    });

    it('should reject if any update fails', async () => {
      tx.servicos.update
        .mockResolvedValueOnce({})
        .mockRejectedValueOnce(new Error('update failed'));

      await expect(
        repository.updateServicesAdditional(
          [
            { id: 1, additional: 1 },
            { id: 2, additional: 2 },
          ],
          asTx(tx),
        ),
      ).rejects.toThrow('update failed');
    });
  });

  // ─── Cancelamento ──────────────────────────────────────────────────
  describe('findScheduleStatus', () => {
    it('should return work id and schedule status', async () => {
      tx.programacoes.findUnique.mockResolvedValueOnce({
        id_obra: 10,
        id_status_programacao: 3,
      });

      const result = await repository.findScheduleStatus(3, asTx(tx));

      expect(tx.programacoes.findUnique).toHaveBeenCalledWith({
        where: { id: 3 },
        select: { id_obra: true, id_status_programacao: true },
      });
      expect(result).toEqual({ id_obra: 10, id_status_programacao: 3 });
    });

    it('should return null when schedule does not exist', async () => {
      tx.programacoes.findUnique.mockResolvedValueOnce(null);

      await expect(
        repository.findScheduleStatus(999, asTx(tx)),
      ).resolves.toBeNull();
    });
  });

  describe('findScheduleItemsExecution', () => {
    it('should return service id, real and status of each item', async () => {
      const rows = [
        { id_servico: 1, real: 5, status: 'EXECUTADO' },
        { id_servico: 2, real: null, status: null },
      ];
      tx.programacoes_servicos.findMany.mockResolvedValueOnce(rows);

      const result = await repository.findScheduleItemsExecution(3, asTx(tx));

      expect(tx.programacoes_servicos.findMany).toHaveBeenCalledWith({
        where: { id_programacao: 3 },
        select: { id_servico: true, real: true, status: true },
      });
      expect(result).toEqual(rows);
    });
  });

  describe('deleteScheduleItems', () => {
    it('should delete all items of the schedule', async () => {
      tx.programacoes_servicos.deleteMany.mockResolvedValueOnce({ count: 4 });

      const result = await repository.deleteScheduleItems(3, asTx(tx));

      expect(tx.programacoes_servicos.deleteMany).toHaveBeenCalledWith({
        where: { id_programacao: 3 },
      });
      expect(result).toBeUndefined();
    });
  });

  describe('resetScheduleProgress', () => {
    it('should set prog to 0 and exec to null', async () => {
      await repository.resetScheduleProgress(3, asTx(tx));

      expect(tx.programacoes.update).toHaveBeenCalledWith({
        where: { id: 3 },
        data: { prog: 0, exec: null },
      });
    });
  });

  // ─── Itens da obra ─────────────────────────────────────────────────
  describe('applyAdditional', () => {
    it('should updateMany qtde_adicional for each item', async () => {
      const data = [
        { id: 1, additional: 4 },
        { id: 2, additional: 0 },
      ] as ApplyAdditonalDTO[];

      await repository.applyAdditional(data, asTx(tx));

      expect(tx.servicos.updateMany).toHaveBeenCalledTimes(2);
      expect(tx.servicos.updateMany).toHaveBeenNthCalledWith(1, {
        data: { qtde_adicional: 4 },
        where: { id: 1 },
      });
      expect(tx.servicos.updateMany).toHaveBeenNthCalledWith(2, {
        data: { qtde_adicional: 0 },
        where: { id: 2 },
      });
    });

    it('should not call prisma when list is empty', async () => {
      await repository.applyAdditional([], asTx(tx));

      expect(tx.servicos.updateMany).not.toHaveBeenCalled();
    });
  });

  describe('addItem', () => {
    const dto = {
      idService: 50,
      idWork: 10,
      operation: 'OP-1',
      point: 'P1',
      operationDescription: 'Instalação',
      quantity: 8,
    } as AddServicesDTO;

    it('should create a service item (id_contrato_servico set, id_material null)', async () => {
      await repository.addItem(dto, 'service', asTx(tx));

      expect(tx.servicos.create).toHaveBeenCalledWith({
        data: {
          id_obra: 10,
          id_contrato_servico: 50,
          id_material: null,
          operacao: 'OP-1',
          ponto: 'P1',
          descricao_operacao: 'Instalação',
          qtde_plan: 0,
          viabilizado: 8,
        },
      });
    });

    it('should create a material item (id_material set, id_contrato_servico null)', async () => {
      await repository.addItem(dto, 'material', asTx(tx));

      expect(tx.servicos.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          id_contrato_servico: null,
          id_material: 50,
        }),
      });
    });

    it('should always create with qtde_plan = 0 and viabilizado = quantity', async () => {
      await repository.addItem({ ...dto, quantity: 0 }, 'service', asTx(tx));

      const { data } = tx.servicos.create.mock.calls[0][0];
      expect(data.qtde_plan).toBe(0);
      expect(data.viabilizado).toBe(0);
    });
  });

  describe('delete', () => {
    it('should delete the service by id', async () => {
      await repository.delete(5, asTx(tx));

      expect(tx.servicos.delete).toHaveBeenCalledWith({ where: { id: 5 } });
    });

    it('should propagate P2025 when service does not exist', async () => {
      const error = Object.assign(new Error('not found'), { code: 'P2025' });
      tx.servicos.delete.mockRejectedValueOnce(error);

      await expect(repository.delete(5, asTx(tx))).rejects.toBe(error);
    });
  });

  describe('deleteAll', () => {
    it('should delete all services and the report of the work', async () => {
      await repository.deleteAll(10, asTx(tx));

      expect(tx.servicos.deleteMany).toHaveBeenCalledWith({
        where: { id_obra: 10 },
      });
      expect(tx.relatorio.deleteMany).toHaveBeenCalledWith({
        where: { id_obra: 10 },
      });
    });

    it('should delete services before the report', async () => {
      await repository.deleteAll(10, asTx(tx));

      expect(tx.servicos.deleteMany.mock.invocationCallOrder[0]).toBeLessThan(
        tx.relatorio.deleteMany.mock.invocationCallOrder[0],
      );
    });

    it('should not delete the report if deleting services fails', async () => {
      tx.servicos.deleteMany.mockRejectedValueOnce(new Error('FK violation'));

      await expect(repository.deleteAll(10, asTx(tx))).rejects.toThrow(
        'FK violation',
      );
      expect(tx.relatorio.deleteMany).not.toHaveBeenCalled();
    });
  });

  describe('bulkImportItems', () => {
    const items = [
      {
        type: 'service',
        idService: 50,
        operation: 'OP-1',
        point: 'P1',
        operationNumber: '001',
        operationDescription: 'Instalação',
        plannedQuantity: 10,
      },
      {
        type: 'material',
        idService: 60,
        operation: 'OP-2',
        point: 'P2',
        operationNumber: '002',
        operationDescription: 'Cabo',
        plannedQuantity: 3,
      },
    ] as ImportServiceItem[];

    it('should do nothing when items list is empty', async () => {
      await repository.bulkImportItems(10, [], asTx(tx));

      expect(tx.servicos.createMany).not.toHaveBeenCalled();
      expect(tx.relatorio.upsert).not.toHaveBeenCalled();
    });

    it('should create services and materials mapped correctly', async () => {
      await repository.bulkImportItems(10, items, asTx(tx));

      expect(tx.servicos.createMany).toHaveBeenCalledWith({
        data: [
          {
            id_obra: 10,
            id_contrato_servico: 50,
            id_material: null,
            operacao: 'OP-1',
            ponto: 'P1',
            numero_operacao: '001',
            descricao_operacao: 'Instalação',
            qtde_plan: 10,
            qtde_adicional: 0,
          },
          {
            id_obra: 10,
            id_contrato_servico: null,
            id_material: 60,
            operacao: 'OP-2',
            ponto: 'P2',
            numero_operacao: '002',
            descricao_operacao: 'Cabo',
            qtde_plan: 3,
            qtde_adicional: 0,
          },
        ],
      });
    });

    it('should upsert the report as encontrado after creating items', async () => {
      await repository.bulkImportItems(10, items, asTx(tx));

      expect(tx.relatorio.upsert).toHaveBeenCalledWith({
        where: { id_obra: 10 },
        create: { id_obra: 10, encontrado: true },
        update: { encontrado: true },
      });
      expect(tx.servicos.createMany.mock.invocationCallOrder[0]).toBeLessThan(
        tx.relatorio.upsert.mock.invocationCallOrder[0],
      );
    });

    it('should not upsert the report if createMany fails', async () => {
      tx.servicos.createMany.mockRejectedValueOnce(new Error('insert failed'));

      await expect(
        repository.bulkImportItems(10, items, asTx(tx)),
      ).rejects.toThrow('insert failed');
      expect(tx.relatorio.upsert).not.toHaveBeenCalled();
    });
  });

  // ─── Recálculo: leituras ───────────────────────────────────────────
  const expectedScheduleItemSelect = {
    id_programacao: true,
    id_servico: true,
    prog: true,
    real: true,
    servicos: { select: { id_material: true } },
    status: true,
  };

  const scheduleRows = [
    {
      id_programacao: 1,
      id_servico: 10,
      prog: 5,
      real: 3,
      servicos: { id_material: null },
      status: 'EXECUTADO',
    },
    {
      id_programacao: 2,
      id_servico: 11,
      prog: 8,
      real: null,
      servicos: { id_material: 99 },
      status: null,
    },
  ];

  const expectedScheduleItems = [
    {
      scheduleId: 1,
      serviceId: 10,
      prog: 5,
      real: 3,
      isMaterial: false,
      status: 'EXECUTADO',
    },
    {
      scheduleId: 2,
      serviceId: 11,
      prog: 8,
      real: null,
      isMaterial: true,
      status: null,
    },
  ];

  describe('findScheduleItemsByServiceIds', () => {
    it('should query by service ids and map rows to ScheduleItem', async () => {
      tx.programacoes_servicos.findMany.mockResolvedValueOnce(scheduleRows);

      const result = await repository.findScheduleItemsByServiceIds(
        [10, 11],
        asTx(tx),
      );

      expect(tx.programacoes_servicos.findMany).toHaveBeenCalledWith({
        where: { id_servico: { in: [10, 11] } },
        select: expectedScheduleItemSelect,
      });
      expect(result).toEqual(expectedScheduleItems);
    });

    it('should treat id_material = 0 as material (only null is service)', async () => {
      tx.programacoes_servicos.findMany.mockResolvedValueOnce([
        { ...scheduleRows[0], servicos: { id_material: 0 } },
      ]);

      const [item] = await repository.findScheduleItemsByServiceIds(
        [10],
        asTx(tx),
      );

      expect(item.isMaterial).toBe(true);
    });

    it.each([['REPROGRAMADO'], ['NAO_EXECUTADO']])(
      'should carry the status %s through to the ScheduleItem',
      async (status) => {
        tx.programacoes_servicos.findMany.mockResolvedValueOnce([
          { ...scheduleRows[0], status },
        ]);

        const [item] = await repository.findScheduleItemsByServiceIds(
          [10],
          asTx(tx),
        );

        expect(item.status).toBe(status);
      },
    );

    it('should return an empty array when nothing is found', async () => {
      tx.programacoes_servicos.findMany.mockResolvedValueOnce([]);

      await expect(
        repository.findScheduleItemsByServiceIds([10], asTx(tx)),
      ).resolves.toEqual([]);
    });
  });

  describe('findScheduleItemsByWork', () => {
    it('should query by work through the schedule relation and map rows', async () => {
      tx.programacoes_servicos.findMany.mockResolvedValueOnce(scheduleRows);

      const result = await repository.findScheduleItemsByWork(10, asTx(tx));

      expect(tx.programacoes_servicos.findMany).toHaveBeenCalledWith({
        where: { programacoes: { id_obra: 10 } },
        select: expectedScheduleItemSelect,
      });
      expect(result).toEqual(expectedScheduleItems);
    });
  });

  describe('findWorkItems', () => {
    it('should query work items and map them to WorkItem', async () => {
      tx.servicos.findMany.mockResolvedValueOnce([
        { id_material: null, viabilizado: 10, qtde_adicional: 2, qtde_real: 5 },
        { id_material: 7, viabilizado: 4, qtde_adicional: 0, qtde_real: null },
      ]);

      const result = await repository.findWorkItems(10, asTx(tx));

      expect(tx.servicos.findMany).toHaveBeenCalledWith({
        where: { id_obra: 10 },
        select: {
          id: true,
          id_material: true,
          viabilizado: true,
          qtde_adicional: true,
          qtde_real: true,
        },
      });
      expect(result).toEqual([
        {
          isMaterial: false,
          enabledQuantity: 10,
          additionalQuantity: 2,
          realQuantity: 5,
        },
        {
          isMaterial: true,
          enabledQuantity: 4,
          additionalQuantity: 0,
          realQuantity: null,
        },
      ]);
    });

    it('should return an empty array when the work has no items', async () => {
      tx.servicos.findMany.mockResolvedValueOnce([]);

      await expect(repository.findWorkItems(10, asTx(tx))).resolves.toEqual([]);
    });
  });

  describe('findWorkStatus', () => {
    it('should return the work status', async () => {
      tx.obras.findUnique.mockResolvedValueOnce({ id_status: 35 });

      const result = await repository.findWorkStatus(10, asTx(tx));

      expect(tx.obras.findUnique).toHaveBeenCalledWith({
        where: { id: 10 },
        select: { id_status: true },
      });
      expect(result).toBe(35);
    });

    it('should return null when the work does not exist', async () => {
      tx.obras.findUnique.mockResolvedValueOnce(null);

      await expect(repository.findWorkStatus(10, asTx(tx))).resolves.toBeNull();
    });

    it('should return null when id_status is null', async () => {
      tx.obras.findUnique.mockResolvedValueOnce({ id_status: null });

      await expect(repository.findWorkStatus(10, asTx(tx))).resolves.toBeNull();
    });

    it('should keep status 0 (uses ?? and not ||)', async () => {
      tx.obras.findUnique.mockResolvedValueOnce({ id_status: 0 });

      await expect(repository.findWorkStatus(10, asTx(tx))).resolves.toBe(0);
    });
  });

  // ─── Recálculo: escritas ───────────────────────────────────────────
  describe('updateServiceTotals', () => {
    it('should update qtde_prog and qtde_real of each service', async () => {
      const totals = [
        { serviceId: 1, plannedQuantity: 10, realQuantity: 4 },
        { serviceId: 2, plannedQuantity: 0, realQuantity: null },
      ] as ServiceTotals[];

      await repository.updateServiceTotals(totals, asTx(tx));

      expect(tx.servicos.update).toHaveBeenCalledTimes(2);
      expect(tx.servicos.update).toHaveBeenNthCalledWith(1, {
        where: { id: 1 },
        data: { qtde_prog: 10, qtde_real: 4 },
      });
      expect(tx.servicos.update).toHaveBeenNthCalledWith(2, {
        where: { id: 2 },
        data: { qtde_prog: 0, qtde_real: null },
      });
    });

    it('should not call prisma when totals list is empty', async () => {
      await repository.updateServiceTotals([], asTx(tx));

      expect(tx.servicos.update).not.toHaveBeenCalled();
    });
  });

  describe('updateSchedulesProgress', () => {
    it('should do nothing when data is empty', async () => {
      await repository.updateSchedulesProgress([], asTx(tx));

      expect(tx.$executeRaw).not.toHaveBeenCalled();
    });

    it('should run a single bulk UPDATE with CASE for prog and exec', async () => {
      const data: SchedulesProgressUpdate[] = [
        { idProgramacao: 1, prog: 10, exec: 5 },
        { idProgramacao: 2, prog: 20, exec: 7.5 },
      ];

      await repository.updateSchedulesProgress(data, asTx(tx));

      expect(tx.$executeRaw).toHaveBeenCalledTimes(1);

      const query = getRawQuery(tx);
      expect(normalize(query.sql)).toBe(
        'UPDATE programacoes ' +
          'SET prog = CASE id WHEN ? THEN ? WHEN ? THEN ? END, ' +
          'exec = CASE id WHEN ? THEN ? WHEN ? THEN ? END ' +
          'WHERE id IN (?,?)',
      );
      expect(query.values).toEqual([
        1,
        10,
        2,
        20, // prog
        1,
        5,
        2,
        7.5, // exec
        1,
        2, // ids
      ]);
    });

    it('should write NULL::DOUBLE PRECISION literal when exec is null (no bound param)', async () => {
      const data: SchedulesProgressUpdate[] = [
        { idProgramacao: 1, prog: 10, exec: null },
        { idProgramacao: 2, prog: 20, exec: 3 },
      ];

      await repository.updateSchedulesProgress(data, asTx(tx));

      const query = getRawQuery(tx);
      expect(normalize(query.sql)).toContain(
        'exec = CASE id WHEN ? THEN NULL::DOUBLE PRECISION WHEN ? THEN ? END',
      );
      expect(query.values).toEqual([
        1,
        10,
        2,
        20, // prog
        1,
        2,
        3, // exec (sem valor para o null)
        1,
        2, // ids
      ]);
    });

    it('should keep exec = 0 as a bound value (not NULL)', async () => {
      await repository.updateSchedulesProgress(
        [{ idProgramacao: 1, prog: 0, exec: 0 }],
        asTx(tx),
      );

      const query = getRawQuery(tx);
      expect(normalize(query.sql)).not.toContain('NULL');
      expect(query.values).toEqual([1, 0, 1, 0, 1]);
    });

    it('should propagate raw query errors', async () => {
      tx.$executeRaw.mockRejectedValueOnce(new Error('syntax error'));

      await expect(
        repository.updateSchedulesProgress(
          [{ idProgramacao: 1, prog: 1, exec: 1 }],
          asTx(tx),
        ),
      ).rejects.toThrow('syntax error');
    });
  });

  describe('updateWorkProgress', () => {
    it('should only update executado when demote is false', async () => {
      await repository.updateWorkProgress(10, 75, false, asTx(tx));

      expect(tx.obras.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { executado: 75 },
      });
    });

    it('should also demote status and clear conclusion date when demote is true', async () => {
      await repository.updateWorkProgress(10, 75, true, asTx(tx));

      expect(tx.obras.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: {
          executado: 75,
          id_status: DEMOTED_WORK_STATUS,
          data_conclusao: null,
        },
      });
    });

    it('should accept executado = 0', async () => {
      await repository.updateWorkProgress(10, 0, false, asTx(tx));

      expect(tx.obras.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { executado: 0 },
      });
    });
  });
});
