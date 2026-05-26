import { FeasibilityService } from 'src/application/usecases/feasibility.service';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { AreaEditGuard } from 'src/core/guards/newPermission.guard';

@Controller('viabilidade')
export class FeasibilityController {
  constructor(private readonly feasibilityService: FeasibilityService) {}

  @Get('/:id')
  async getFeasibility(@Param('id', ParseIntPipe) id: number) {
    const response = await this.feasibilityService.feasibilityExists(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Viabilidade existe',
      data: response,
    };
  }

  @Delete('/:id')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async deleteFeasibilityFiles(@Param('id', ParseIntPipe) id: number) {
    await this.feasibilityService.deleteFeasibilityFiles(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Viabilidade excluída com sucesso',
    };
  }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  @UseGuards(AreaEditGuard({ allowedAreas: [8] }))
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('idObra', ParseIntPipe) idWork: number,
  ) {
    return await this.feasibilityService.handleUpload(idWork, files);
  }
}
