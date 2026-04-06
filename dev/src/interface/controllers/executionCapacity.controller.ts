import { ExecutionCapacityService } from 'src/application/usecases/executionCapacity.service';
import { PermissionGuard } from 'src/core/guards/permission.guard';

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import {
  ExecutionCapacityDTO,
  UpdateExecutionCapacityDTO,
} from '../dtos/executionCapacityDTO';
import { VisualizationGuard } from 'src/core/guards/visualization.guard';

interface CustomRequest extends Request {
  idParceira?: number;
  insufficientPermission?: boolean;
}

@Controller('capacidade-execucao')
export class ExecutionCapacityController {
  constructor(
    private readonly executionCapacityService: ExecutionCapacityService,
  ) {}

  private applyFilters<
    T extends {
      idParceira?: number | number[];
      insufficientPermission?: boolean;
    },
  >(filters: T, req: CustomRequest): T {
    if (req.idParceira) {
      filters.idParceira = req.idParceira;
    }
    if (req.insufficientPermission !== undefined) {
      filters.insufficientPermission = req.insufficientPermission;
    }
    return filters;
  }

  @Get()
  @UseGuards(VisualizationGuard)
  async getExecutionCapacity(
    @Query()
    filters: ExecutionCapacityDTO,
    @Req() req: any,
  ) {
    const filtersWithPermission = this.applyFilters(filters, req);

    const [executionCapacityValues, financialValues] = await Promise.all([
      this.executionCapacityService.get(filtersWithPermission),
      this.executionCapacityService.getFinancialValue(filtersWithPermission),
    ]);

    const response = {
      financialValues,
      executionCapacityValues,
    };

    return {
      statusCode: HttpStatus.OK,
      message: 'Capacidade de execução retornada',
      data: response,
    };
  }

  @Patch()
  @UseGuards(PermissionGuard)
  async updateExecutionCapacity(@Body() data: UpdateExecutionCapacityDTO[]) {
    await this.executionCapacityService.update(data);

    return {
      statusCode: HttpStatus.OK,
      message: 'Atualizado valores da capacidade de execução',
    };
  }
}
