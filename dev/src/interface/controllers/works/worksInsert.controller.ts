import {
  InsertMarketWorksDTO,
  InsertNotesDTO,
} from 'src/interface/dtos/worksDto';

import { Body, Controller, HttpStatus, Post, UseGuards } from '@nestjs/common';
import { InsertWorksService } from 'src/application/usecases/works/InsertWorks.service';
import { AreaEditGuard } from 'src/core/guards/newPermission.guard';

@Controller('obras')
export class WorksInsertController {
  constructor(private insertWorksService: InsertWorksService) {}

  @Post('inserir-ov')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async InsertMarketWorks(
    @Body() marketWorksParameters: InsertMarketWorksDTO[],
  ) {
    const { insertedCount, message, skipped } =
      await this.insertWorksService.insertMarketWorks(marketWorksParameters);

    return {
      statusCode: HttpStatus.OK,
      message,
      insertedCount,
      skipped,
    };
  }

  @Post('inserir-notas')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async InsertNotes(@Body() data: InsertNotesDTO[]) {
    await this.insertWorksService.insertNotes(data);

    return {
      statusCode: HttpStatus.OK,
      message: 'Notas inseridas com sucesso',
    };
  }
}
