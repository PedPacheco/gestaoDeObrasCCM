import { FeasibilityService } from 'src/application/usecases/feasibility.service';

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Param,
  ParseBoolPipe,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { HandleFeasibilityService } from 'src/application/usecases/orchestrators/handleFeasibilityUpload.service';
import {
  AreaEditGuard,
  AreaViewGuard,
} from 'src/core/guards/newPermission.guard';
import { UploadSignaturePipe } from 'src/core/pipes/uploadSignature.pipe';
import { ValidateFeasibilityItemsPipe } from 'src/core/pipes/validateFeasibilityItems.pipe';
import { DOCUMENT_UPLOAD_PRESET } from 'src/shared/upload/uploadPresets';
import { RejectFeasibilityDTO } from '../dtos/feasibilityDTO';
import { ServiceMaterialItemDto } from '../dtos/workServicesDTO';

@Controller('viabilidade')
export class FeasibilityController {
  constructor(
    private readonly feasibilityService: FeasibilityService,
    private readonly handleFeasibilityService: HandleFeasibilityService,
  ) {}

  @Get('/:id')
  @UseGuards(AreaViewGuard())
  async getFeasibility(@Param('id', ParseIntPipe) id: number) {
    const response = await this.feasibilityService.feasibilityExists(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Viabilidade existe',
      data: response,
    };
  }

  @Get('reprovacoes/:id')
  @UseGuards(AreaViewGuard({ allowedAreas: [8] }))
  async getRejectionsHistory(@Param('id', ParseIntPipe) id: number) {
    const response = await this.feasibilityService.getRejections(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Reprovações retornados com sucesso',
      data: response,
    };
  }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files', DOCUMENT_UPLOAD_PRESET.maxFiles))
  @UseGuards(AreaEditGuard({ allowedAreas: [8] }))
  async upload(
    @UploadedFiles(UploadSignaturePipe) files: Express.Multer.File[] = [],
    @Body('workId', ParseIntPipe) workId: number,
    @Body('pointByPoint', ParseBoolPipe) pointByPoint: boolean,
    @Body('existingFiles') existingFiles: string,
    @Req() req: any,
    @Body('items', ValidateFeasibilityItemsPipe)
    items?: ServiceMaterialItemDto[],
  ) {
    const userId = req.user.sub;

    const parsedExistingFiles =
      existingFiles && existingFiles.trim().length > 0
        ? JSON.parse(existingFiles)
        : [];

    await this.handleFeasibilityService.upload(
      workId,
      userId,
      pointByPoint,
      files,
      parsedExistingFiles,
      items,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Viabilidade realizada com sucesso',
    };
  }

  @Patch('upload')
  @UseInterceptors(FilesInterceptor('files', DOCUMENT_UPLOAD_PRESET.maxFiles))
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async uploadComplementaryFiles(
    @UploadedFiles(UploadSignaturePipe) files: Express.Multer.File[] = [],
    @Body('workId', ParseIntPipe) workId: number,
    @Body('existingFiles') existingFiles: string,
    @Req() req: any,
  ) {
    const userId = req.user.sub;

    const parsedExistingFiles =
      existingFiles && existingFiles.trim().length > 0
        ? JSON.parse(existingFiles)
        : [];

    await this.handleFeasibilityService.uploadComplementaryFiles(
      workId,
      userId,
      files,
      parsedExistingFiles,
    );

    return {
      statusCode: HttpStatus.OK,
      message: 'Arquivos complementares inseridos com sucesso',
    };
  }

  @Post('reprovar')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async rejectFeasibility(@Body() data: RejectFeasibilityDTO) {
    await this.handleFeasibilityService.reject(data);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Viabilidade reprovada com sucesso',
    };
  }

  @Patch('aprovar/:id')
  @UseGuards(AreaEditGuard({ allowedAreas: [8], blockPartner: true }))
  async approveFeasibility(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
  ) {
    const userId = req.user.sub;

    await this.handleFeasibilityService.approve(id, userId);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Viabilidade aprovada com sucesso',
    };
  }
}
