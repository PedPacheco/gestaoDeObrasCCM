import {
  Body,
  Controller,
  Get,
  HttpStatus,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { PermissionGuard } from 'src/core/guards/permission.guard';
import {
  ExecutionCapacityDTO,
  UpdateExecutionCapacityDTO,
} from '../dtos/executionCapacityDTO';
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
