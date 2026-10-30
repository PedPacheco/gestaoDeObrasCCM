import { BadRequestException } from '@nestjs/common';
import {
  DocumentRule,
  getDocumentRule as resolveDocumentRule,
} from 'src/domain/services/requireDpNumber.service';

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

  rejected: boolean;
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

  readonly rejected: boolean;

  private static readonly MAX_NUM_DP = 8;
  private static readonly MIN_NUM_BRA = 12;
  private static readonly DP_REGEX = /^\d{8}$/;

  private static readonly MISSING_MESSAGES: Record<DocumentRule, string> = {
    DP: 'Falta inserir número do DP',
    BRA: 'Falta inserir número do BRA',
    DP_OR_BRA: 'Falta inserir número do DP ou do BRA',
  };

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

    this.rejected = props.rejected ?? false;
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
      rejected: this.rejected,
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
    this.validateDpFormat();
  }

  /** Regras próprias de cada tipo de programação. */
  protected abstract validateSpecific(): void;

  /**
   * Documento esperado no numDp (regra definida em service-document.rule.ts):
   * - "dp + lv"                                → DP ou BRA
   * - "lv", "lv + obra livre"                  → BRA
   * - "dp", "regularização", "desativação rd"  → DP
   * - fora da lista                            → null
   */
  protected getDocumentRule(): DocumentRule | null {
    return resolveDocumentRule(this.serviceType);
  }

  /** Valida o formato do número, se estiver preenchido (sem o tornar obrigatório). */
  protected validateDpFormat(): void {
    const value = this.numDp?.trim();
    if (!value) return;

    // Tipos fora da lista mantêm a validação de DP
    this.assertDocumentFormat(value, this.getDocumentRule() ?? 'DP');
  }

  /** Regra de confirmação: DP (8 dígitos) e/ou BRA (mín. 12 caracteres) obrigatório. */
  public requireDpNumber(): void {
    const rule = this.getDocumentRule();
    if (!rule) return;

    const value = this.numDp?.trim();

    if (!value || value === '0') {
      throw new BadRequestException(BaseSchedule.MISSING_MESSAGES[rule]);
    }

    this.assertDocumentFormat(value, rule);
  }

  private assertDocumentFormat(value: string, rule: DocumentRule): void {
    const isValidDp = BaseSchedule.DP_REGEX.test(value);
    const isValidBra = value.length >= BaseSchedule.MIN_NUM_BRA;

    if (rule === 'DP' && !isValidDp) {
      throw new BadRequestException(
        'Número do DP deve conter exatamente 8 dígitos',
      );
    }

    if (rule === 'BRA' && !isValidBra) {
      throw new BadRequestException(
        `Número do BRA deve conter no mínimo ${BaseSchedule.MIN_NUM_BRA} caracteres`,
      );
    }

    if (rule === 'DP_OR_BRA' && !isValidDp && !isValidBra) {
      throw new BadRequestException(
        `Número inválido: o DP deve conter exatamente 8 dígitos e o BRA no mínimo ${BaseSchedule.MIN_NUM_BRA} caracteres`,
      );
    }
  }
}
