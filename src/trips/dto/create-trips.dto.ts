import { IsNotEmpty, IsNumber, IsString, IsDateString } from 'class-validator';


export class CreateTripsDto {
@IsNumber()
user_id: number;


@IsNumber()
vehicle_id: number;


@IsString()
@IsNotEmpty()
departure_location: string;


@IsString()
@IsNotEmpty()
arrival_location: string;


@IsDateString()
departure_time: string;


@IsDateString()
arrival_time: string;


@IsNumber()
availability: number;


@IsNumber()
price: number;
}