import { FindExistingWorksService } from 'src/application/works/findExistingWorks.service';
import {
  AUXILIARY_BASE_REPOSITORY,
  IAuxiliaryBaseRepository,
} from 'src/domain/repositories/IAuxiliaryBaseRepository';
import { NotesDTO } from 'src/interface/dtos/auxiliaryBaseDTO';
import { OperationType } from 'src/interface/types/baseAuxiliaryInterface';

import { Inject, Injectable } from '@nestjs/common';

interface InsertNotesResult {
  insertedCount: number;
  skippedNotes: string[];
}

interface ValidationResult {
  validatedData: NotesDTO[];
  skippedNotes: string[];
}

@Injectable()
export class AuxiliaryNotesInsertService {
  constructor(
    @Inject(AUXILIARY_BASE_REPOSITORY)
    private readonly auxiliaryBaseRepository: IAuxiliaryBaseRepository,
    private readonly findExistingWorksService: FindExistingWorksService,
  ) {}

  async execute(
    data: NotesDTO[],
    operation: OperationType,
  ): Promise<InsertNotesResult> {
    if (!data?.length) {
      return { insertedCount: 0, skippedNotes: [] };
    }

    const validationResult = await this.validateAndFilterExistingData(
      data,
      operation,
    );

    if (validationResult.validatedData.length === 0) {
      return {
        insertedCount: 0,
        skippedNotes: validationResult.skippedNotes,
      };
    }

    const notesData = validationResult.validatedData.map((item) => {
      if (item.conjunto === '37') {
        return {
          ...item,
          conjunto: '0',
          ehRda: true,
        };
      }
      return { ...item, ehRda: false };
    });

    await this.auxiliaryBaseRepository.insertNotes(notesData);

    return {
      insertedCount: validationResult.validatedData.length,
      skippedNotes: validationResult.skippedNotes,
    };
  }

  private async validateAndFilterExistingData(
    data: NotesDTO[],
    operation: OperationType,
  ): Promise<ValidationResult> {
    const validatedData: NotesDTO[] = [];
    const skippedNotes: string[] = [];

    const orderingFields = data.map((item) => item.campo_ordenacao.toString());
    const orderData = data.map((item) => ({
      ordem_dci: item.ordem_dci?.toString(),
      ordem_dcd: item.ordem_dcd?.toString(),
      ordem_dca: item.ordem_dca?.toString(),
      ordem_dcim: item.ordem_dcim?.toString(),
    }));

    const [existingNotes, existingOrders] = await Promise.all([
      this.findExistingWorksService.findExistingWorks(orderingFields),
      this.findExistingWorksService.findExistingOrders(orderData),
    ]);

    const existingNotesSet = new Set(existingNotes.map((note) => note.ovnota));
    const existingOrdersSet = new Set(existingOrders);

    for (const item of data) {
      const skipResult = this.shouldSkipItem(
        item,
        existingNotesSet,
        existingOrdersSet,
      );

      if (operation === 'insert') {
        if (skipResult.noteExists && skipResult.orderExists) {
          skippedNotes.push(item.campo_ordenacao);
          continue;
        }
      } else {
        if (!skipResult.noteExists) {
          skippedNotes.push(item.campo_ordenacao);
          continue;
        }
      }

      validatedData.push(item);
    }

    return { validatedData, skippedNotes };
  }

  private shouldSkipItem(
    notesData: any,
    existingNotesSet: Set<string>,
    existingOrdersSet: Set<string>,
  ): { noteExists: boolean; orderExists: boolean } {
    const noteExists = existingNotesSet.has(notesData.campo_ordenacao);

    const orders = [
      notesData.ordem_dci,
      notesData.ordem_dcd,
      notesData.ordem_dca,
      notesData.ordem_dcim,
    ].filter(Boolean);

    const orderExists = orders.some((order) => existingOrdersSet.has(order));

    return {
      noteExists,
      orderExists,
    };
  }
}
