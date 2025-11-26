// vehicles/dto/update-vehicle.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateVehicleDto } from './create-vehicles.dto';

export class UpdateVehicleDto extends PartialType(CreateVehicleDto) {}