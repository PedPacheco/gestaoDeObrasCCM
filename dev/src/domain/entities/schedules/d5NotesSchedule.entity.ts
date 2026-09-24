import { BadRequestException } from '@nestjs/common';
import { BaseSchedule, BaseScheduleProps } from './baseSchedule.entity';

export interface D5ScheduleProps extends BaseScheduleProps {
  d5NoteId: number;
  creatorUserId?: number;
  modifyingUserId: number;
  filePaths?: string[];
}

export type D5ScheduleChanges = Omit<
  Partial<D5ScheduleProps>,
  'd5NoteId' | 'creatorUserId'
>;

export class D5NoteSchedule extends BaseSchedule {
  readonly d5NoteId: number;
  readonly creatorUserId?: number;
  readonly modifyingUserId: number;
  readonly filePaths?: string[];

  private static readonly MAX_NUM_DP = 25;
  private static readonly MAX_RESPONSIBILITY = 50;
  private static readonly MAX_FILES = 5;

  constructor(props: D5ScheduleProps) {
    super(props);

    this.d5NoteId = props.d5NoteId;
    this.creatorUserId = props.creatorUserId;
    this.modifyingUserId = props.modifyingUserId;
    this.filePaths = props.filePaths ?? [];

    this.validate();
    this.validateFiles();
    this.validateExecutionFields();
    this.validateDpNumber();
  }

  private get hasExecution(): boolean {
    console.log(this.exec);
    return this.exec !== null && this.exec !== undefined;
  }

  protected validateSpecific(): void {
    if (!this.d5NoteId || this.d5NoteId <= 0) {
      throw new BadRequestException('ID da nota D5 é obrigatório');
    }

    if (this.id == null && (!this.creatorUserId || this.creatorUserId <= 0)) {
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
      this.responsibility &&
      this.responsibility.length > D5NoteSchedule.MAX_RESPONSIBILITY
    ) {
      throw new BadRequestException(
        `Responsável pela restrição deve ter no máximo ${D5NoteSchedule.MAX_RESPONSIBILITY} caracteres`,
      );
    }
  }

  private validateExecutionFields(): void {
    if (this.hasExecution) {
      return;
    }

    if (this.filePaths.length > 0) {
      throw new BadRequestException(
        'Só é possível anexar ficheiros após informar a execução',
      );
    }

    if (this.executionObservation) {
      throw new BadRequestException(
        'A observação de execução só pode ser preenchida após informar a execução',
      );
    }
  }

  private validateFiles(): void {
    if (this.filePaths.length > D5NoteSchedule.MAX_FILES) {
      throw new BadRequestException(
        `Máximo de ${D5NoteSchedule.MAX_FILES} ficheiros permitidos por programação`,
      );
    }

    if (new Set(this.filePaths).size !== this.filePaths.length) {
      throw new BadRequestException('Existem ficheiros duplicados');
    }
  }

  public withChanges(changes: D5ScheduleChanges): D5NoteSchedule {
    return D5NoteSchedule.create({
      ...this.toPublicProps(),
      ...changes,
      d5NoteId: this.d5NoteId,
      creatorUserId: this.creatorUserId,
    });
  }

  public toPublicProps(): D5ScheduleProps {
    return {
      ...this.baseProps(),
      d5NoteId: this.d5NoteId,
      creatorUserId: this.creatorUserId,
      modifyingUserId: this.modifyingUserId,
      filePaths: this.filePaths,
    };
  }

  static create(props: D5ScheduleProps): D5NoteSchedule {
    return new D5NoteSchedule(props);
  }
}
