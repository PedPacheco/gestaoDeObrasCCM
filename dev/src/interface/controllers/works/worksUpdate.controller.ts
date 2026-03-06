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
import { HandleWorkUpdateService } from 'src/application/services/orchestrators/handleWorkUpdate.service';
import { ContractUpdateService } from 'src/application/services/works/contractUpdate.service';
import { UpdateOvService } from 'src/application/services/works/updateOv.service';
import { UpdateNoteService } from 'src/application/services/works/updateNote.service';
import { UpdateCapexService } from 'src/application/services/works/updateCapex.service';
import { SuspensionWorkService } from 'src/application/services/works/suspensionWork.service';

interface CustomRequest extends Request {
  idParceira?: number;
  insufficientPermission?: boolean;
}

@Controller('obras')
export class WorksUpdateController {
  constructor(
    private handleWorkUpdateService: HandleWorkUpdateService,
    private contractUpdateService: ContractUpdateService,
    private updateOvService: UpdateOvService,
    private updateNoteService: UpdateNoteService,
    private updateCapexService: UpdateCapexService,
    private suspensionWorksService: SuspensionWorkService,
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
    const insufficientPermission = req.insufficientPermission;

    await this.handleWorkUpdateService.update(data, id, insufficientPermission);

    return {
      statusCode: HttpStatus.OK,
      message: 'Obras atualizada com sucesso',
    };
  }

  @Post('atualizar-ov')
  @UseGuards(PermissionGuard)
  async updateOv(
    @Body()
    body: InsertMarketWorksDTO[],
  ) {
    await this.updateOvService.update(body);

    return {
      statusCode: HttpStatus.OK,
      message: 'Obras atualizada com sucesso',
    };
  }

  @Post('atualizar-nota')
  @UseGuards(PermissionGuard)
  async updateNote(@Body() data: UpdateNotesDTO[]) {
    await this.updateNoteService.update(data);

    return {
      statusCode: HttpStatus.OK,
      message: 'Obras atualizada com sucesso',
    };
  }

  @Post('atualizar-capex')
  @UseGuards(PermissionGuard)
  async updateCapex() {
    await this.updateCapexService.update();

    return {
      statusCode: HttpStatus.OK,
      message: 'Capex e M.O atualizado com sucesso',
    };
  }
}
