import { FeasibilityService } from 'src/application/usecases/feasibility.service';

import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
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
import { HandleFeasibilityService } from 'src/application/usecases/orchestrators/handleFeasibilityUpdate.service';
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
    @Body('items', ValidateFeasibilityItemsPipe)
    items: ServiceMaterialItemDto[],
    @Req() req: any,
  ) {
    const idUser = req.user.sub;

    await this.handleFeasibilityService.update(idWork, idUser, files, items);

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
  @UseGuards(AreaEditGuard({ allowedAreas: [8] }))
  async approveFeasibility(@Param('id', ParseIntPipe) id: number) {
    await this.feasibilityService.approve(id);

    return {
      statusCode: HttpStatus.NO_CONTENT,
      message: 'Viabilidade aprovada com sucesso',
    };
  }
}
