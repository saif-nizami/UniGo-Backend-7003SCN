// vehicles/dto/create-vehicle.dto.ts
import { IsString, IsNumber, IsOptional, IsInt } from 'class-validator';

export class CreateVehicleDto {
  @IsInt()
  user_id: number;

  @IsOptional()
  @IsString()
  model?: string;

  @IsString()
  plate_number: string;

  @IsOptional()
  @IsString()
  color?: string;

  @IsOptional()
  @IsNumber()
  capacity?: number;

  @IsOptional()
  @IsString()
  s3_imagelink?: string;

  @IsOptional()
  @IsInt()
  created_by?: number;

  @IsOptional()
  @IsInt()
  modified_by?: number;
}
