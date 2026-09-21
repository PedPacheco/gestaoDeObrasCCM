import { BadRequestException } from '@nestjs/common';

export interface BaseScheduleProps {
  // Obrigatórios
  dataProg: Date;
  prog: number;

  // Opcionais comuns
  id?: number;
  exec?: number;
  startTime?: Date;
  finishTime?: Date;
  observation?: string;
  executionObservation?: string;
  serviceType?: string;
  numDp?: string;
  chi?: number;

  // Equipas / chave
  lmTeam?: number;
  regulTeam?: number;
  lvTeam?: number;
  temporaryKey?: boolean;

  // Técnico / restrição de execução
  idTechnical?: number;
  idExecutionRestriction?: number;
  responsibility?: string;
}

export abstract class BaseSchedule {
  readonly dataProg: Date;
  readonly prog: number;

  readonly id?: number;
  readonly exec?: number;
  readonly startTime?: Date;
  readonly finishTime?: Date;
  readonly observation?: string;
  readonly executionObservation?: string;
  readonly serviceType?: string;
  readonly numDp?: string;
  readonly chi?: number;

  readonly lmTeam: number;
  readonly regulTeam: number;
  readonly lvTeam: number;
  readonly temporaryKey: boolean;

  readonly idTechnical: number;
  readonly idExecutionRestriction: number;
  readonly responsibility?: string;

  protected constructor(props: BaseScheduleProps) {
    this.dataProg = props.dataProg;
    this.prog = props.prog;

    this.id = props.id;
    this.exec = props.exec;
    this.startTime = props.startTime;
    this.finishTime = props.finishTime;
    this.observation = props.observation;
    this.executionObservation = props.executionObservation;
    this.serviceType = props.serviceType;
    this.numDp = props.numDp;
    this.chi = props.chi;

    this.lmTeam = props.lmTeam ?? 0;
    this.regulTeam = props.regulTeam ?? 0;
    this.lvTeam = props.lvTeam ?? 0;
    this.temporaryKey = props.temporaryKey ?? false;

    this.idTechnical = props.idTechnical ?? 1;
    this.idExecutionRestriction = props.idExecutionRestriction ?? 1;
    this.responsibility = props.responsibility;
    // ⚠️ validate() NÃO é chamado aqui — só na subclasse
  }

  protected baseProps(): BaseScheduleProps {
    return {
      dataProg: this.dataProg,
      prog: this.prog,
      id: this.id,
      exec: this.exec,
      startTime: this.startTime,
      finishTime: this.finishTime,
      observation: this.observation,
      executionObservation: this.executionObservation,
      serviceType: this.serviceType,
      numDp: this.numDp,
      chi: this.chi,
      lmTeam: this.lmTeam,
      regulTeam: this.regulTeam,
      lvTeam: this.lvTeam,
      temporaryKey: this.temporaryKey,
      idTechnical: this.idTechnical,
      idExecutionRestriction: this.idExecutionRestriction,
      responsibility: this.responsibility,
    };
  }

  /** Template method: regras comuns + hook da subclasse. */
  protected validate(): void {
    if (this.prog < 0 || this.prog > 100) {
      throw new BadRequestException('Programado deve estar entre 0 e 100');
    }

    if (this.exec !== undefined && (this.exec < 0 || this.exec > 100)) {
      throw new BadRequestException('Executado deve estar entre 0 e 100');
    }

    if (
      this.startTime &&
      this.finishTime &&
      this.startTime >= this.finishTime
    ) {
      throw new BadRequestException(
        'Horário de fim deve ser posterior ao início',
      );
    }

    this.validateSpecific();
  }

  /** Regras próprias de cada tipo de programação. */
  protected abstract validateSpecific(): void;

  protected checkTypeOfService(): boolean {
    if (!this.serviceType) return false;
    return this.serviceType.toUpperCase().includes('DP');
  }

  /** Regra de confirmação: DP obrigatório com 8 dígitos. */
  public validatedSchedulingConfirmation(): void {
    if (!this.checkTypeOfService()) return;

    const dp = this.numDp?.trim();

    if (!dp || dp === '0') {
      throw new BadRequestException('Falta inserir número do DP');
    }

    if (!/^\d{8}$/.test(dp)) {
      throw new BadRequestException(
        'Número do DP deve conter exatamente 8 dígitos',
      );
    }
  }
}
