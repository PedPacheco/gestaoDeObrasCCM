import { Controller, Get, HttpStatus, Query, UseGuards } from '@nestjs/common';
import { PermissionGuard } from 'src/core/guards/permission.guard';
import { ExecutionCapacityDTO } from '../dtos/executionCapacityDTO';
import { ExecutionCapacityService } from 'src/application/executionCapacity.service';

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
    const response = await this.executionCapacityService.get(filters);

    return {
      statusCode: HttpStatus.OK,
      message: 'Capacidade de execução retornada',
      data: response,
    };
  }
}
