import { ExecutionCapacityService } from 'src/application/usecases/executionCapacity.service';
import { PermissionGuard } from 'src/core/guards/permission.guard';

import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import {
  ExecutionCapacityDTO,
  UpdateExecutionCapacityDTO,
} from '../dtos/executionCapacityDTO';

@Controller('capacidade-execucao')
export class ExecutionCapacityController {
  constructor(
    private readonly executionCapacityService: ExecutionCapacityService,
  ) {}

  @Get()
  @UseGuards(PermissionGuard)
  async getExecutionCapacity(
    @Query()
    filters: ExecutionCapacityDTO,
  ) {
    const [executionCapacityValues, financialValues] = await Promise.all([
      this.executionCapacityService.get(filters),
      this.executionCapacityService.getFinancialValue(filters),
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
