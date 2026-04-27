import { HandleWorkUpdateService } from 'src/application/usecases/orchestrators/handleWorkUpdate.service';
import { ContractUpdateService } from 'src/application/usecases/works/contractUpdate.service';
import { SuspensionWorkService } from 'src/application/usecases/works/suspensionWork.service';
import { UpdateNoteService } from 'src/application/usecases/works/updateNote.service';
import { UpdateOvService } from 'src/application/usecases/works/updateOv.service';
import { PermissionGuard } from 'src/core/guards/permission.guard';
import { VisualizationGuard } from 'src/core/guards/visualization.guard';
import {
  ContractUpdateDTO,
  InsertMarketWorksDTO,
  SuspensionWorksDTO,
  UpdateNotesDTO,
  UpdateWorkDTO,
} from 'src/interface/dtos/worksDto';

import {
  Body,
  Controller,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';

interface CustomRequest extends Request {
  idParceira?: number;
  insufficientPermission?: boolean;
}

@Controller('obras')
export class WorksUpdateController {
  constructor(
    private readonly handleWorkUpdateService: HandleWorkUpdateService,
    private readonly contractUpdateService: ContractUpdateService,
    private readonly updateOvService: UpdateOvService,
    private readonly updateNoteService: UpdateNoteService,
    private readonly suspensionWorksService: SuspensionWorkService,
  ) {}

  @Post('atualizar-empreitamento')
  @UseGuards(PermissionGuard)
  async ContractUpdate(@Body() data: ContractUpdateDTO[]) {
    await this.contractUpdateService.update(data);
    return {
      statusCode: HttpStatus.OK,
      message: 'Empreitamento das obras atualizado com sucesso',
    };
  }

  @Post('suspender-obras')
  @UseGuards(PermissionGuard)
  async SuspensionWorks(@Body() data: SuspensionWorksDTO[]) {
    await this.suspensionWorksService.createMultipleSuspensions(data);
    return {
      statusCode: HttpStatus.OK,
      message: 'Obras suspensas com sucesso',
    };
  }

  @Patch(':id')
  @UseGuards(VisualizationGuard)
  async Update(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: UpdateWorkDTO,
    @Req() req: CustomRequest,
  ) {
    await this.handleWorkUpdateService.update(
      data,
      id,
      req.insufficientPermission,
    );
    return {
      statusCode: HttpStatus.OK,
      message: 'Obra atualizada com sucesso',
    };
  }

  @Post('atualizar-ov')
  @UseGuards(PermissionGuard)
  async updateOv(@Body() body: InsertMarketWorksDTO[]) {
    await this.updateOvService.update(body);
    return {
      statusCode: HttpStatus.OK,
      message: 'Obras atualizadas com sucesso',
    };
  }

  @Post('atualizar-nota')
  @UseGuards(PermissionGuard)
  async updateNote(@Body() data: UpdateNotesDTO[]) {
    await this.updateNoteService.update(data);
    return {
      statusCode: HttpStatus.OK,
      message: 'Obras atualizadas com sucesso',
    };
  }
}
