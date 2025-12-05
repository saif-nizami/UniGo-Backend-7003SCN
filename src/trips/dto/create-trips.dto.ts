import { IsNotEmpty, IsNumber, IsString, IsDateString, IsOptional } from 'class-validator';


export class CreateTripsDto {
@IsNumber()
user_id: number;

@IsNumber()
vehicle_id: number;

@IsString()
@IsOptional()
dep_lat: string;

@IsString()
@IsOptional()
dep_lng: string;

@IsString()
@IsOptional()
arr_lat: string;

@IsString()
@IsOptional()
arr_lng: string;

@IsDateString()
dep_time: string;

@IsDateString()
arr_time: string;

@IsNumber()
availability: number;

@IsNumber()
price: number;
}