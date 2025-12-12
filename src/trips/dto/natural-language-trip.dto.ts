import { IsNotEmpty, IsString } from 'class-validator';

export class NaturalLanguageTripDto {
  @IsString()
  @IsNotEmpty()
  text: string;
}

export interface NaturalLanguageTripResponse {
  departure_location: string | null;
  arrival_location: string | null;
  seats: number | null;
  departure_time: string | null;
  price: number | null;
}
