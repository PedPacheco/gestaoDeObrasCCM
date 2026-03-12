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
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';

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
  async deleteFeasibilityFiles(@Param('id', ParseIntPipe) id: number) {
    await this.feasibilityService.deleteFeasibilityFiles(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Viabilidade excluída com sucesso',
    };
  }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  async upload(
    @UploadedFiles() files: Express.Multer.File[],
    @Body('idObra', ParseIntPipe) idWork: number,
  ) {
    return await this.feasibilityService.handleUpload(idWork, files);
  }
}
