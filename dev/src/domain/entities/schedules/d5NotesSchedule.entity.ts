import { BadRequestException } from '@nestjs/common';
import { BaseSchedule, BaseScheduleProps } from './baseSchedule.entity';

export interface D5ScheduleProps extends BaseScheduleProps {
  d5NoteId: number;
  creatorUserId: number;
  modifyingUserId: number;
}

export class D5NoteSchedule extends BaseSchedule {
  readonly d5NoteId: number;
  readonly creatorUserId: number;
  readonly modifyingUserId: number;

  private static readonly MAX_NUM_DP = 25;
  private static readonly MAX_SERVICE_TYPE = 30;
  private static readonly MAX_RESPONSIBILITY = 50;

  constructor(props: D5ScheduleProps) {
    super(props);

    this.d5NoteId = props.d5NoteId;
    this.creatorUserId = props.creatorUserId;
    this.modifyingUserId = props.modifyingUserId;

    this.validate();
  }

  protected validateSpecific(): void {
    if (!this.d5NoteId || this.d5NoteId <= 0) {
      throw new BadRequestException('ID da nota D5 é obrigatório');
    }
    if (!this.creatorUserId || this.creatorUserId <= 0) {
      throw new BadRequestException('Utilizador criador é obrigatório');
    }
    if (!this.modifyingUserId || this.modifyingUserId <= 0) {
      throw new BadRequestException('Utilizador modificador é obrigatório');
    }
    if (!this.dataProg || isNaN(this.dataProg.getTime())) {
      throw new BadRequestException('Data de programação inválida');
    }
    if (!!this.startTime !== !!this.finishTime) {
      throw new BadRequestException(
        'Informe hora de início e hora de término em conjunto',
      );
    }
    if (this.numDp && this.numDp.length > D5NoteSchedule.MAX_NUM_DP) {
      throw new BadRequestException(
        `Número do DP deve ter no máximo ${D5NoteSchedule.MAX_NUM_DP} caracteres`,
      );
    }
    if (
      this.serviceType &&
      this.serviceType.length > D5NoteSchedule.MAX_SERVICE_TYPE
    ) {
      throw new BadRequestException(
        `Tipo de serviço deve ter no máximo ${D5NoteSchedule.MAX_SERVICE_TYPE} caracteres`,
      );
    }
    if (
      this.responsibility &&
      this.responsibility.length > D5NoteSchedule.MAX_RESPONSIBILITY
    ) {
      throw new BadRequestException(
        `Responsável pela restrição deve ter no máximo ${D5NoteSchedule.MAX_RESPONSIBILITY} caracteres`,
      );
    }
  }

  public withChanges(changes: Partial<D5ScheduleProps>): D5NoteSchedule {
    return D5NoteSchedule.create({ ...this.toProps(), ...changes });
  }

  private toProps(): D5ScheduleProps {
    return {
      ...this.baseProps(),
      d5NoteId: this.d5NoteId,
      creatorUserId: this.creatorUserId,
      modifyingUserId: this.modifyingUserId,
    };
  }

  static create(props: D5ScheduleProps): D5NoteSchedule {
    return new D5NoteSchedule(props);
  }
}
