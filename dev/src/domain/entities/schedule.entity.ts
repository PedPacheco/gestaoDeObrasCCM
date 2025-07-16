import { BadRequestException } from '@nestjs/common';

export class Schedule {
  constructor(
    public readonly idWork: number,
    public readonly dataProg: Date,
    public readonly startTime: Date,
    public readonly finishTime: Date,
    public readonly prog: number,
    public readonly exec?: number,
    public readonly id?: number,
    public readonly serviceType?: string,
    public readonly equipment?: string,
    public readonly chi?: number,
    public readonly numDp?: string,
    public readonly temporaryKey: boolean = false,
    public readonly lmTeam: number = 0,
    public readonly regulTeam: number = 0,
    public readonly lvTeam: number = 0,
    public readonly idTechnical: number = 1,
    public readonly idExecutionRestriction: number = 1,
    public readonly responsibilityExecution?: string,
    public readonly observationExecution?: string,
    public readonly idProgRestriction1: number = 1,
    public readonly responsiblityProg?: string,
    public readonly responsibleName?: string,
    public readonly responsibleArea?: string,
    public readonly restrictionStatus?: string,
    public readonly resolutionDate?: Date,
    public readonly observationProg?: string,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.idWork || this.idWork <= 0) {
      throw new BadRequestException('ID da obra é obrigatório');
    }

    if (this.prog < 0 || this.prog > 100) {
      throw new BadRequestException('Programado deve estar entre 0 e 100');
    }

    if (this.startTime >= this.finishTime) {
      throw new BadRequestException(
        'Horário de fim deve ser posterior ao início',
      );
    }
  }

  static create(data: {
    idWork: number;
    dataProg: Date;
    startTime: Date;
    finishTime: Date;
    prog: number;
    [key: string]: any;
  }): Schedule {
    return new Schedule(
      data.idWork,
      data.dataProg,
      data.startTime,
      data.finishTime,
      data.prog,
      data.exec,
      data.id,
      data.serviceType,
      data.equipment,
      data.chi,
      data.numDp,
      data.temporaryKey,
      data.lmTeam,
      data.regulTeam,
      data.lvTeam,
      data.idTechnical,
      data.idExecutionRestriction,
      data.responsibilityExecution,
      data.observationExecution,
      data.idProgRestriction1,
      data.responsiblityProg,
      data.responsibleName,
      data.responsibleArea,
      data.restrictionStatus,
      data.resolutionDate,
      data.observationProg,
    );
  }
}
