import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';

export class GetEquipmentDTO {
  @IsOptional()
  @IsString()
  ovnota?: string;

  @IsOptional()
  @IsString()
  ordemDiagrama?: string;
}

export class GetEquipmentListDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GetEquipmentDTO)
  items: GetEquipmentDTO[];
}
