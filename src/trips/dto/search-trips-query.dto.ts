import { IsNumberString, IsOptional } from 'class-validator';

export class SearchTripsQueryDto {
  @IsOptional()
  @IsNumberString()
  user_id?: string;

  @IsOptional()
  @IsNumberString()
  destination_lat?: string;

  @IsOptional()
  @IsNumberString()
  destination_lng?: string;

  @IsOptional()
  @IsNumberString()
  arrival_lat?: string;

  @IsOptional()
  @IsNumberString()
  arrival_lng?: string;

  @IsOptional()
  @IsNumberString()
  radius?: string;
}
