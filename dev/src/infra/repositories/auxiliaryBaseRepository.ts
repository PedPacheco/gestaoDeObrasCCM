import { MarketWork } from 'src/domain/entities/works.entity';
import { IAuxiliaryBaseRepository } from 'src/domain/repositories/IAuxiliaryBaseRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { InsertBaseAuxiliaryMarketDTO } from 'src/interface/dtos/auxiliaryBaseDTO';

import { Injectable, Logger } from '@nestjs/common';
import { GetAuxiliaryBaseMaterialsInterface } from 'src/interface/types/works/capexInterface';
import { InsertNotesInterface } from 'src/interface/types/baseAuxiliaryInterface';
import { Prisma } from '@prisma/client';

@Injectable()
export class AuxiliaryBaseRepository implements IAuxiliaryBaseRepository {
  private readonly logger = new Logger(AuxiliaryBaseRepository.name);

  // Máximo de registros por chamada de createMany.
  // 200 é conservador porque o createMany gera um único INSERT com todos
  // os valores inline — muito mais pesado em bytes do que um UPDATE.
  private readonly INSERT_BATCH_SIZE = 200;

  // Tentativas em caso de queda de conexão transitória.
  private readonly MAX_RETRIES = 3;

  constructor(private readonly prisma: PrismaService) {}

  // ─── Retry helper ─────────────────────────────────────────────────────────

  /**
   * Executa `operation` com backoff exponencial.
   * Só faz retry em erros reconhecíveis de conexão/timeout do Prisma/SQL Server.
   */
  private async withRetry<T>(operation: () => Promise<T>): Promise<T> {
    const CONNECTION_ERROR_CODES = new Set([
      'P1001',
      'P1002',
      'P1008',
      'P1017',
    ]);
    const CONNECTION_ERROR_MESSAGES = [
      'server has closed the connection',
      'connection refused',
      'connection timed out',
      'econnreset',
      'socket hang up',
    ];

    for (let attempt = 1; attempt <= this.MAX_RETRIES; attempt++) {
      try {
        return await operation();
      } catch (error: any) {
        const msg: string = (error?.message ?? '').toLowerCase();
        const code: string = error?.code ?? '';

        const isConnectionError =
          CONNECTION_ERROR_CODES.has(code) ||
          CONNECTION_ERROR_MESSAGES.some((m) => msg.includes(m));

        if (isConnectionError && attempt < this.MAX_RETRIES) {
          const delayMs = 300 * 2 ** (attempt - 1); // 300ms, 600ms, 1200ms…
          this.logger.warn(
            `Operação Tentativa ${attempt}/${this.MAX_RETRIES} falhou (${error.message}). ` +
              `Aguardando ${delayMs}ms antes de tentar novamente.`,
          );
          await new Promise((res) => setTimeout(res, delayMs));
          continue;
        }

        throw error;
      }
    }
  }

  // ─── Métodos existentes (inalterados) ─────────────────────────────────────

  async getAuxiliaryBaseNotes(idRegional?: number): Promise<any[]> {
    return await this.prisma.base_auxiliar.findMany({
      where: { municipios: { id_regional: idRegional || undefined } },
      select: {
        id: true,
        obra: true,
        pep: true,
        dci: true,
        dcd: true,
        dca: true,
        dcim: true,
        entrada: true,
        prazo: true,
        referencia: true,
        mo_plan: true,
        qtde_plan: true,
        aux_gpm: true,
        aux_empreendimento: true,
        aux_tipo: true,
        aux_turma: true,
        aux_circuito: true,
        aux_tecnico: true,
        capex_mo_plan: true,
        capex_mat_plan: true,
        anoplan: true,
        eh_rda: true,
      },
    });
  }

  async getAuxiliaryBaseMarket(idRegional?: number): Promise<MarketWork[]> {
    const response = await this.prisma.base_auxiliar_ov.findMany({
      where: { municipios: { id_regional: idRegional || undefined } },
      select: {
        id: true,
        obra: true,
        pep: true,
        diagrama: true,
        prazo_texto: true,
        entrada: true,
        status_ov: true,
        status_diagrama: true,
        status_pep: true,
        mo_cliente: true,
        mo_empresa: true,
        aux_circuito: true,
        aux_municipio: true,
        aux_turma: true,
        aux_tipo_obra: true,
        equip_num_pedido: true,
        observacao: true,
      },
    });

    return response.map((work) =>
      MarketWork.create({
        obra: work.obra,
        pep: work.pep,
        entrada: work.entrada,
        prazoTexto: work.prazo_texto,
        equipeNumPedido: work.equip_num_pedido,
        idMunicipio: work.aux_municipio,
        idTipo: work.aux_tipo_obra,
        idParceira: work.aux_turma,
        idCircuito: work.aux_circuito,
        diagrama: work.diagrama,
        observacao: work.observacao,
        statusOv: work.status_ov,
        statusDiagrama: work.status_diagrama,
        statusPep: work.status_pep,
        moCliente: work.mo_cliente,
        moEmpresa: work.mo_empresa,
        id: Number(work.id),
      }),
    );
  }

  async getAuxiliaryBaseCN52N(): Promise<GetAuxiliaryBaseMaterialsInterface[]> {
    try {
      const result = await this.prisma.$queryRawUnsafe<
        GetAuxiliaryBaseMaterialsInterface[]
      >(`
      SELECT 
        id_obra,
        obras.ovnota,
        cn52n.diagrama_rede,
        cn52n.elemento_pep,
        cn52n.def_proj,
        cn52n.material,
        cn52n.cti,
        cn52n.preco,
        cn52n.qtd_necessaria,
        cn52n.qtd_retirada,
        cn52n.qtd_recebida,
        cn52n.qtd_falta,
        cn52n.reserva AS reserva
      FROM cn52n
      INNER JOIN construcao_sp.obras ON obras.id = cn52n.id_obra
    `);

      return result;
    } catch (error) {
      throw error;
    }
  }

  async getFator(
    materialDefs: { material: string; pep_ref: string }[],
  ): Promise<Map<string, number>> {
    if (materialDefs.length === 0) {
      return new Map();
    }

    const materials = [...new Set(materialDefs.map((m) => m.material))];
    const pepRefs = [...new Set(materialDefs.map((m) => m.pep_ref))];

    const fatores = await this.prisma.conversao.findMany({
      where: {
        material: { in: materials },
        pep_ref: { in: pepRefs },
      },
      select: {
        material: true,
        pep_ref: true,
        fator: true,
      },
    });

    const requestedSet = new Set(
      materialDefs.map((m) => `${m.material}|${m.pep_ref}`),
    );

    const fatorMap = new Map<string, number>();
    for (const f of fatores) {
      const key = `${f.material}|${f.pep_ref}`;
      if (requestedSet.has(key)) {
        fatorMap.set(key, f.fator);
      }
    }

    return fatorMap;
  }

  async delete(tableToDelete: string, id?: number): Promise<any> {
    try {
      if (tableToDelete === 'baseOv') {
        if (id) {
          return await this.prisma.base_auxiliar_ov.delete({ where: { id } });
        }
        return await this.prisma.base_auxiliar_ov.deleteMany();
      }

      if (id) {
        return await this.prisma.base_auxiliar.delete({ where: { id } });
      } else {
        return await this.prisma.base_auxiliar.deleteMany();
      }
    } catch (error: any) {
      this.logger.error('Erro ao excluir obra: ', error.stack);
      throw error;
    }
  }

  async insertMarket(data: InsertBaseAuxiliaryMarketDTO[]): Promise<void> {
    try {
      const [municipios, tipos, circuitos] = await Promise.all([
        this.prisma.municipios.findMany({ select: { id: true, mun: true } }),
        this.prisma.tipos.findMany({
          select: { id: true, descricao_sap: true },
        }),
        this.prisma.circuitos.findMany({
          select: { id: true, circuito: true },
        }),
      ]);

      const municipioMap = new Map(municipios.map((m) => [m.mun, m.id]));
      const tipoMap = new Map(tipos.map((t) => [t.descricao_sap, t.id]));
      const circuitoMap = new Map(circuitos.map((c) => [c.circuito, c.id]));

      const marketWorks = data.map((item) => {
        const aux_municipio = municipioMap.get(item.gpm) ?? 1;
        const aux_tipo_obra = tipoMap.get(item.tipo) ?? 1;
        const aux_circuito = circuitoMap.get(item.circuito) ?? 1;

        return {
          obra: item.obra,
          pep: item.pep,
          diagrama: item.diagrama,
          gpm: item.gpm,
          tipo: item.tipo,
          circuito: item.circuito,
          prazo_texto: item.prazoTexto,
          status_ov: Number(item.statusOv),
          status_diagrama: item.statusDiagrama,
          status_pep: item.statusPep,
          equip_num_pedido: item.equipeNumPedido,
          mo_cliente: item.moCliente,
          mo_empresa: item.moEmpresa,
          entrada: new Date(item.entrada),
          aux_municipio,
          aux_tipo_obra,
          aux_circuito,
          aux_turma: 1,
        };
      });

      await this.prisma.base_auxiliar_ov.createMany({
        data: marketWorks,
        skipDuplicates: true,
      });
    } catch (error: any) {
      this.logger.error(
        'Erro ao inserir dados da base auxiliar OV:',
        error.stack,
      );
      throw new Error('Falha ao inserir dados da base auxiliar OV');
    }
  }

  async insertNotes(data: InsertNotesInterface[]): Promise<any> {
    try {
      const rows = data.map(
        (item) => Prisma.sql`
        ROW(
        ${item.campo_ordenacao},
        ${item.pep},
        ${item.ordem_dci},
        ${item.ordem_dcd},
        ${item.ordem_dca},
        ${item.ordem_dcim},
        ${item.conjunto},
        ${item.grp_plnj_pm},
        ${item.texto_breve},
        ${item.denominacao},
        ${item.ehRda}
        )::construcao_sp.base_auxiliar_input
        `,
      );

      const query = Prisma.sql`SELECT construcao_sp.insert_base_auxiliar_bulk(ARRAY[${Prisma.join(rows)}]::construcao_sp.base_auxiliar_input[])`;

      await this.prisma.$executeRaw(query);

      return { message: 'Dados inseridos com sucesso' };
    } catch (error) {
      throw error;
    }
  }

  /**
   * Insere registros na tabela cn52n em mini-batches de INSERT_BATCH_SIZE.
   *
   * Por que não um único createMany?
   * O Prisma/SQL Server transforma createMany em um único INSERT com todos
   * os valores inline. Com 1 000 registros e ~15 colunas cada, o statement
   * pode facilmente ultrapassar os limites de pacote/timeout do servidor,
   * causando "Server has closed the connection".
   *
   * Cada mini-batch roda com retry + backoff exponencial para absorver
   * quedas de conexão transitórias sem derrubar o job inteiro.
   */
  async insertCapex(data: any[]): Promise<void> {
    for (let i = 0; i < data.length; i += this.INSERT_BATCH_SIZE) {
      const batch = data.slice(i, i + this.INSERT_BATCH_SIZE);

      await this.withRetry(() =>
        this.prisma.cn52n.createMany({ data: batch, skipDuplicates: true }),
      );
    }
  }

  async truncateCN52N(): Promise<void> {
    await this.prisma.$executeRawUnsafe(`TRUNCATE TABLE cn52n`);
  }

  async getObraIdsByDiagramas(
    diagramas: string[],
  ): Promise<Map<string, number>> {
    if (diagramas.length === 0) return new Map();

    const obras = await this.prisma.$queryRaw<
      { diagrama_ref: string; id: number }[]
    >`
    SELECT DISTINCT
      dl.diagrama AS diagrama_ref,
      o.id
    FROM unnest(${diagramas}::text[]) AS dl(diagrama)
    JOIN obras o
      ON  o.ordem_dci  = dl.diagrama
      OR o.ordem_dcd  = dl.diagrama
      OR o.ordem_dca  = dl.diagrama
      OR o.ordem_dcim = dl.diagrama
      OR o.diagrama::text = dl.diagrama
  `;

    const map = new Map<string, number>();
    obras.forEach((obra) => {
      map.set(obra.diagrama_ref, obra.id);
    });

    return map;
  }
}
