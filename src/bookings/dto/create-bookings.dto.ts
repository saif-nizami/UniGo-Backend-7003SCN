import { IsInt, IsNumber, IsOptional } from 'class-validator';

export class CreateBookingDto {
  @IsInt()
  user_id: number;

  @IsInt()
  seat: number;

  @IsOptional()
  @IsNumber()
  price?: number;

  @IsOptional()
  pickup_point: JSON

  @IsOptional()
  pickup_lat_lng: string
}
