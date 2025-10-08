import { InsertWorksService } from 'src/application/works/InsertWorks.service';
import { PermissionGuard } from 'src/core/guards/permission.guard';
import {
  InsertMarketWorksDTO,
  InsertNotesDTO,
} from 'src/interface/dtos/worksDto';

import { Body, Controller, HttpStatus, Post, UseGuards } from '@nestjs/common';

@Controller('obras')
export class WorksInsertController {
  constructor(private insertWorksService: InsertWorksService) {}

  @Post('inserir-ov')
  @UseGuards(PermissionGuard)
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
  @UseGuards(PermissionGuard)
  async InsertNotes(@Body() data: InsertNotesDTO[]) {
    await this.insertWorksService.insertNotes(data);

    return {
      statusCode: HttpStatus.OK,
      message: 'Notas inseridas com sucesso',
    };
  }
}
