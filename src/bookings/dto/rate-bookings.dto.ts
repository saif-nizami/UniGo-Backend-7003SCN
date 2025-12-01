import { IsInt, IsNumber, Min, Max, IsOptional } from 'class-validator';

export class RateBookingDto {
  @IsInt()
  booking_id: number;

  @IsNumber()
  @Min(1)
  @Max(5)
  rating: number;

  @IsOptional()
  comment?: string;
}