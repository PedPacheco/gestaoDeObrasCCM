import { BadRequestException } from '@nestjs/common';
import { BaseSchedule, BaseScheduleProps } from './baseSchedule.entity';

export interface WorkScheduleProps extends BaseScheduleProps {
  idWork: number;

  // Estreitados: obrigatórios em obras
  startTime: Date;
  finishTime: Date;

  equipment?: string;
  idScheduleStatus?: number;
  rejected?: boolean;
  observationRestriction?: string;
  idUser?: number;

  // Restrição de programação 1
  idProgRestriction1?: number;
  responsibilityProg?: string;
  responsibleName?: string;
  responsibleArea?: string;
  restrictionStatus?: string;
  resolutionDate?: Date;

  // Restrição de programação 2
  idProgRestriction2?: number;
  responsibilityProg2?: string;
  responsibleName2?: string;
  responsibleArea2?: string;
  restrictionStatus2?: string;
  resolutionDate2?: Date;
}

export class WorkSchedule extends BaseSchedule {
  // Estreitamento de tipo — não gera código em runtime
  declare readonly startTime: Date;
  declare readonly finishTime: Date;

  readonly idWork: number;
  readonly equipment?: string;
  readonly idScheduleStatus: number;
  readonly rejected: boolean;
  readonly observationRestriction?: string;
  readonly idUser?: number;

  readonly idProgRestriction1: number;
  readonly responsibilityProg?: string;
  readonly responsibleName?: string;
  readonly responsibleArea?: string;
  readonly restrictionStatus?: string;
  readonly resolutionDate?: Date;

  readonly idProgRestriction2: number;
  readonly responsibilityProg2?: string;
  readonly responsibleName2?: string;
  readonly responsibleArea2?: string;
  readonly restrictionStatus2?: string;
  readonly resolutionDate2?: Date;

  constructor(props: WorkScheduleProps) {
    super(props);

    this.idWork = props.idWork;
    this.equipment = props.equipment;
    this.idScheduleStatus = props.idScheduleStatus ?? 1;
    this.rejected = props.rejected ?? false;
    this.observationRestriction = props.observationRestriction;
    this.idUser = props.idUser;

    this.idProgRestriction1 = props.idProgRestriction1 ?? 1;
    this.responsibilityProg = props.responsibilityProg;
    this.responsibleName = props.responsibleName;
    this.responsibleArea = props.responsibleArea;
    this.restrictionStatus = props.restrictionStatus;
    this.resolutionDate = props.resolutionDate;

    this.idProgRestriction2 = props.idProgRestriction2 ?? 1;
    this.responsibilityProg2 = props.responsibilityProg2;
    this.responsibleName2 = props.responsibleName2;
    this.responsibleArea2 = props.responsibleArea2;
    this.restrictionStatus2 = props.restrictionStatus2;
    this.resolutionDate2 = props.resolutionDate2;

    this.validate(); // ✅ sempre a última instrução
  }

  protected validateSpecific(): void {
    if (!this.idWork || this.idWork <= 0) {
      throw new BadRequestException('ID da obra é obrigatório');
    }

    if (!this.startTime || !this.finishTime) {
      throw new BadRequestException('Horário de início e fim são obrigatórios');
    }

    if (this.idScheduleStatus <= 0) {
      throw new BadRequestException('Status da programação inválido');
    }
  }

  /** Regra de negócio: atualizar uma programação limpa a reprovação. */
  public clearRejection(): WorkSchedule {
    if (!this.rejected) return this;
    return WorkSchedule.create({ ...this.toProps(), rejected: false });
  }

  /** Nova instância com alterações parciais, integralmente revalidada. */
  public withChanges(changes: Partial<WorkScheduleProps>): WorkSchedule {
    return WorkSchedule.create({ ...this.toProps(), ...changes });
  }

  private toProps(): WorkScheduleProps {
    return {
      ...this.baseProps(),

      startTime: this.startTime,
      finishTime: this.finishTime,

      idWork: this.idWork,
      equipment: this.equipment,
      idScheduleStatus: this.idScheduleStatus,
      rejected: this.rejected,
      observationRestriction: this.observationRestriction,
      idUser: this.idUser,

      idProgRestriction1: this.idProgRestriction1,
      responsibilityProg: this.responsibilityProg,
      responsibleName: this.responsibleName,
      responsibleArea: this.responsibleArea,
      restrictionStatus: this.restrictionStatus,
      resolutionDate: this.resolutionDate,

      idProgRestriction2: this.idProgRestriction2,
      responsibilityProg2: this.responsibilityProg2,
      responsibleName2: this.responsibleName2,
      responsibleArea2: this.responsibleArea2,
      restrictionStatus2: this.restrictionStatus2,
      resolutionDate2: this.resolutionDate2,
    };
  }

  static create(props: WorkScheduleProps): WorkSchedule {
    return new WorkSchedule(props);
  }
}
