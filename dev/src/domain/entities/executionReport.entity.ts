import { BadRequestException } from '@nestjs/common';
import { CreateExecutionReportInput } from 'src/application/types';
import { EquipmentItem } from 'src/interface/dtos/executionReportDTO';
import { parseTimeToDate } from 'src/utils/parseTimeToDate';

export class ExecutionReport {
  private scheduledFinishTime: Date;

  private constructor(
    private readonly idSchedule: number,
    private readonly userId: number,
    private readonly idWork: number,
    private readonly supervisor: string,
    private readonly partialConnectionReleased: boolean,
    private readonly startTime: Date,
    private readonly finishTime: Date,
    private readonly startContact: string,
    private readonly endContact: string,
    private readonly delayJustification: string,
    private readonly hasEquipmentInstalled: boolean,
    private readonly appliedEquipment: EquipmentItem[],
    private readonly hasEquipmentRemoved: boolean,
    private readonly equipmentRemoved: EquipmentItem[],
    private readonly changesExecution: boolean,
    private readonly generalObservation: string,
    private readonly reason: string,
    private readonly provisionalKeyInstalled: boolean,
    private readonly provisionalKeyReference: string,
    private readonly provisionalKeyReferenceWithdrawn: string,
    private readonly files?: string,
    private readonly provisionalKeyWithdrawn?: boolean,
  ) {}

  static create(
    data: CreateExecutionReportInput,
    scheduledFinishTime: Date,
  ): ExecutionReport {
    const instance = new ExecutionReport(
      data.idSchedule,
      data.userId,
      data.idWork,
      data.supervisor,
      data.partialConnectionReleased,
      parseTimeToDate(data.startTime),
      parseTimeToDate(data.finishTime),
      data.startContact,
      data.endContact,
      data.delayJustification,
      data.hasEquipmentInstalled,
      data.appliedEquipment,
      data.hasEquipmentRemoved,
      data.equipmentRemoved,
      data.changesExecution,
      data.generalObservation,
      data.reason,
      data.provisionalKeyInstalled,
      data.provisionalKeyReference,
      data.provisionalKeyReferenceWithdrawn,
      data.files,
      data.provisionalKeyWithdrawn,
    );

    instance.scheduledFinishTime = scheduledFinishTime;
    instance.validate();
    return instance;
  }

  private isComplete(): boolean {
    return [
      this.startTime,
      this.finishTime,
      this.startContact,
      this.endContact,
      this.supervisor,
    ].every((v) => !!v);
  }

  private validate() {
    if (this.hasEquipmentInstalled && !this.appliedEquipment.length) {
      throw new BadRequestException(
        'Deve conter ao menos 1 equipamento aplicado.',
      );
    }

    if (this.hasEquipmentRemoved && !this.equipmentRemoved.length) {
      throw new BadRequestException(
        'Deve conter ao menos 1 equipamento removido.',
      );
    }

    if (this.provisionalKeyInstalled && !this.provisionalKeyReference) {
      throw new BadRequestException(
        'Referência da chave provisória é obrigatória.',
      );
    }

    if (
      this.provisionalKeyWithdrawn &&
      !this.provisionalKeyReferenceWithdrawn
    ) {
      throw new BadRequestException(
        'Referência da chave provisória retirada é obrigatória.',
      );
    }

    if (!this.isComplete() && this.files) {
      throw new BadRequestException(
        'Arquivos só podem ser enviados quando o relatório de execução estiver completo',
      );
    }
  }

  private formatEquipment(equipments: EquipmentItem[]) {
    return {
      equipamentos: equipments.map((e) => e.equipment).join(';'),
      potencias: equipments.map((e) => e.power).join(';'),
      patrimonios: equipments.map((e) => e.patrimony).join(';'),
      instalacao: equipments.map((e) => e.installation).join(';'),
    };
  }

  private get isDelayed(): boolean {
    return this.finishTime.getTime() > this.scheduledFinishTime.getTime();
  }

  toPersistenceObject() {
    const aplicados = this.formatEquipment(this.appliedEquipment);
    const removidos = this.formatEquipment(this.equipmentRemoved);

    return {
      id_usuario: this.userId,
      modificado_por: this.userId,
      id_obra: this.idWork,
      id_programacao: this.idSchedule,
      supervisor: this.supervisor,
      liberado_ligacao_parcial: this.partialConnectionReleased,
      hora_inicio: this.startTime,
      hora_conclusao: this.finishTime,
      contato_inicio: this.startContact,
      contato_termino: this.endContact,
      atraso: this.isDelayed,
      justificativa_atraso: this.delayJustification,
      possui_equipamentos_instalados: this.hasEquipmentInstalled,
      equipamentos_aplicados: aplicados.equipamentos,
      potencia_equipamento_aplicado: aplicados.potencias,
      patrimonio_equipamento_aplicado: aplicados.patrimonios,
      instalacao_equipamento_aplicado: aplicados.instalacao,
      possui_equipamentos_retirados: this.hasEquipmentRemoved,
      equipamentos_retirados: removidos.equipamentos,
      potencia_equipamento_retirado: removidos.potencias,
      patrimonio_equipamento_retirado: removidos.patrimonios,
      instalacao_equipamento_retirado: removidos.instalacao,
      alteracoes_execucao: this.changesExecution,
      observacoes_gerais: this.generalObservation,
      referencia_chave_provisoria: this.provisionalKeyReference,
      chave_provisoria_retirada: this.provisionalKeyWithdrawn,
      motivo: this.reason,
      chave_provisoria_instalada: this.provisionalKeyInstalled,
      referencia_chave_provisoria_retirada:
        this.provisionalKeyReferenceWithdrawn,
      caminho_arquivo: this.files,
    };
  }
}
