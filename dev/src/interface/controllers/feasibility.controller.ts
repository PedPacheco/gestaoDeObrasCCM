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
import {
  AreaEditGuard,
  AreaViewGuard,
} from 'src/core/guards/newPermission.guard';
import { HandleFeasibilityService } from 'src/application/usecases/orchestrators/handleFeasibilityUpload.service';
import { ValidateFeasibilityItemsPipe } from 'src/core/pipes/validateFeasibilityItems.pipe';
import { ServiceMaterialItemDto } from '../dtos/workServicesDTO';
import { RejectFeasibilityDTO } from '../dtos/feasibilityDTO';

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
  @UseGuards(AreaEditGuard({ allowedAreas: [8] }))
  async getRejectionsHistory(@Param('id', ParseIntPipe) id: number) {
    const response = await this.feasibilityService.getRejections(id);

    return {
      statusCode: HttpStatus.OK,
      message: 'Reprovações retornados com sucesso',
      data: response,
    };
  }

  @Post('upload')
  @UseInterceptors(FilesInterceptor('files'))
  @UseGuards(AreaEditGuard({ allowedAreas: [8] }))
  async upload(
    @UploadedFiles() files: Express.Multer.File[] = [],
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
