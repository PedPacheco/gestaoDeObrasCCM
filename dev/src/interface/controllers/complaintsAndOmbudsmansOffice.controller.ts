import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { AreaViewGuard } from 'src/core/guards/newPermission.guard';
import { ComplaintsAndOmbudsmansOfficeDTO } from '../dtos/complaintsAndOmbudsmansOfficeDTO';
import { ComplaintsAndOmbudsmansOfficeService } from 'src/application/usecases/complaintsAndOmbudsmansOffice.service';

@Controller('reclamacoes-ouvidoria')
export class ComplaintsAndOmbudsmansOfficeController {
  constructor(
    private readonly complaintsAndOmbudsmansOfficeService: ComplaintsAndOmbudsmansOfficeService,
  ) {}

  @Get()
  @UseGuards(AreaViewGuard({ allowedAreas: [8, 1] }))
  async getMetrics(@Query() filters: ComplaintsAndOmbudsmansOfficeDTO) {
    return await this.complaintsAndOmbudsmansOfficeService.getMetrics(filters);
  }
}
