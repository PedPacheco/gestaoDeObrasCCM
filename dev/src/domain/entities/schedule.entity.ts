import { BadRequestException } from '@nestjs/common';

export class Schedule {
  constructor(
    public readonly idWork: number,
    public readonly dataProg: Date,
    public readonly startTime: Date,
    public readonly finishTime: Date,
    public readonly prog?: number,
    public readonly id?: number,
    public readonly observation?: string,
    public readonly serviceType?: string,
    public readonly equipment?: string,
    public readonly chi?: number,
    public readonly numDp?: string,
    public readonly temporaryKey: boolean = false,
    public readonly idTechnical: number = 1,
    public readonly observationExecution?: string,
    public readonly idProgRestriction1: number = 1,
    public readonly responsiblityProg?: string,
    public readonly responsibleName?: string,
    public readonly responsibleArea?: string,
    public readonly restrictionStatus?: string,
    public readonly resolutionDate?: Date,
    public readonly idProgRestriction2: number = 1,
    public readonly responsiblityProg2?: string,
    public readonly responsibleName2?: string,
    public readonly responsibleArea2?: string,
    public readonly restrictionStatus2?: string,
    public readonly resolutionDate2?: Date,
    public readonly observationRestriction?: string,
    public readonly idUser?: number,
  ) {
    this.validate();
  }

  private validate(): void {
    if (!this.idWork || this.idWork <= 0) {
      throw new BadRequestException('ID da obra é obrigatório');
    }

    if ((this.prog < 0 || this.prog > 100) && this.prog) {
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
    [key: string]: any;
  }): Schedule {
    return new Schedule(
      data.idWork,
      data.dataProg,
      data.startTime,
      data.finishTime,
      data.prog,
      data.id,
      data.observation,
      data.serviceType,
      data.equipment,
      data.chi,
      data.numDp,
      data.temporaryKey,
      data.idTechnical,
      data.observationExecution,
      data.idProgRestriction1,
      data.responsiblityProg,
      data.responsibleName,
      data.responsibleArea,
      data.restrictionStatus,
      data.resolutionDate,
      data.idProgRestriction2,
      data.responsiblityProg2,
      data.responsibleName2,
      data.responsibleArea2,
      data.restrictionStatus2,
      data.resolutionDate2,
      data.observationRestriction,
      data.idUser,
    );
  }
}
