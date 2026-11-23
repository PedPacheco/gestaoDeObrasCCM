import { parseTimeToDate } from 'src/utils/parseTimeToDate';
import { ValidationError } from '../errors/domain.error';
import { ExecutionReportProps, ExecutionReportSnapshot } from '../types';

type ExecutionReportState = Omit<ExecutionReportSnapshot, 'delayed'>;

export class ExecutionReport {
  private constructor(
    private readonly state: ExecutionReportState,
    private readonly scheduledFinishTime: Date,
  ) {}

  static create(
    props: ExecutionReportProps,
    scheduledFinishTime: Date,
  ): ExecutionReport {
    const instance = new ExecutionReport(
      {
        ...props,
        startTime: parseTimeToDate(props.startTime),
        finishTime: parseTimeToDate(props.finishTime),
        files: ExecutionReport.normalizeFiles(props.files),
      },
      scheduledFinishTime,
    );
    instance.validate();
    return instance;
  }

  toSnapshot(): ExecutionReportSnapshot {
    const s = this.state;
    return {
      ...s,
      appliedEquipment: [...s.appliedEquipment],
      equipmentRemoved: [...s.equipmentRemoved],
      files: [...s.files],
      delayed: this.isDelayed,
    };
  }

  private get isDelayed(): boolean {
    return this.state.finishTime.getTime() > this.scheduledFinishTime.getTime();
  }

  private isComplete(): boolean {
    const s = this.state;
    return [
      s.startTime,
      s.finishTime,
      s.startContact,
      s.endContact,
      s.supervisor,
    ].every((v) => !!v);
  }

  private static normalizeFiles(files?: string[] | null): string[] {
    return (files ?? []).map((name) => name.trim()).filter(Boolean);
  }

  private validate(): void {
    const s = this.state;
    if (s.hasEquipmentInstalled && !s.appliedEquipment.length) {
      throw new ValidationError('Deve conter ao menos 1 equipamento aplicado.');
    }
    if (s.hasEquipmentRemoved && !s.equipmentRemoved.length) {
      throw new ValidationError('Deve conter ao menos 1 equipamento removido.');
    }
    if (s.provisionalKeyInstalled && !s.provisionalKeyReference) {
      throw new ValidationError(
        'Referência da chave provisória é obrigatória.',
      );
    }
    if (s.provisionalKeyWithdrawn && !s.provisionalKeyReferenceWithdrawn) {
      throw new ValidationError(
        'Referência da chave provisória retirada é obrigatória.',
      );
    }
    if (!this.isComplete() && s.files.length > 0) {
      throw new ValidationError(
        'Arquivos só podem ser enviados quando o relatório de execução estiver completo',
      );
    }
  }
}
