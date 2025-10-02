import { DataAuxiliaryNotes } from 'src/application/auxiliaryBase/auxiliaryBase.service';
import { MarketWork } from 'src/domain/entities/works.entity';
import { IAuxiliaryBaseRepository } from 'src/domain/repositories/IAuxiliaryBaseRepository';
import { PrismaService } from 'src/infra/prisma/prisma.service';
import { InsertBaseAuxiliaryMarketDTO } from 'src/interface/dtos/auxiliaryBaseDTO';

import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class AuxiliaryBaseRepository implements IAuxiliaryBaseRepository {
  private readonly logger = new Logger(AuxiliaryBaseRepository.name);
  constructor(private readonly prisma: PrismaService) {}

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

  async getFator(
    materialDefs: { material: string; pep_ref: string }[],
  ): Promise<Map<string, number>> {
    const fatores = await this.prisma.conversao.findMany({
      where: {
        OR: materialDefs,
      },
      select: { material: true, pep_ref: true, fator: true },
    });

    const fatorMap = new Map<string, number>();
    for (const f of fatores) {
      fatorMap.set(`${f.material}|${f.pep_ref}`, f.fator);
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
    } catch (error) {
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
    } catch (error) {
      this.logger.error(
        'Erro ao inserir dados da base auxiliar OV:',
        error.stack,
      );
      throw new Error('Falha ao inserir dados da base auxiliar OV');
    }
  }

  private formatValue(value: string | number | null | undefined): string {
    if (value === null || value === undefined) return 'NULL';
    if (typeof value === 'number') return value.toString();
    return `'${value}'`;
  }

  async insertNotes(data: DataAuxiliaryNotes): Promise<any> {
    try {
      const formattedPayload = data.notesData.map((d) => {
        const valores = data.calculatedValues.find(
          (item) => item.diagrama_rede === d.campo_ordenacao,
        );

        return `(
          ${this.formatValue(d.campo_ordenacao)},
          ${this.formatValue(d.pep)},
          ${this.formatValue(d.ordem_dci)},
          ${this.formatValue(d.ordem_dcd)},
          ${this.formatValue(d.ordem_dca)},
          ${this.formatValue(d.ordem_dcim)},
          ${this.formatValue(d.conjunto)},
          ${this.formatValue(d.grp_plnj_pm)},
          ${this.formatValue(d.texto_breve)},
          ${this.formatValue(d.denominacao)},
          ${this.formatValue(valores?.mo_calc ?? 0)},
          ${this.formatValue(valores?.qtde_calc ?? 0)},
          ${this.formatValue(valores?.capex_mat_calc ?? 0)}
        )`;
      });

      const fullArrayString = `ARRAY[${formattedPayload.join(',')}]::construcao_sp.base_auxiliar_input[]`;

      await this.prisma.$executeRawUnsafe(
        `SELECT construcao_sp.insert_base_auxiliar_bulk(${fullArrayString})`,
      );

      return { message: 'Dados inseridos com sucesso' };
    } catch (error) {
      throw error;
    }
  }
}
