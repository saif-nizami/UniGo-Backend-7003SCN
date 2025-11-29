import { Controller, Get, Query, Param, Post, Body } from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripsDto } from './dto/create-trips.dto';

@Controller('api')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get('users/me/trips')
  getMyTrips(
    @Query('userId') userId: number,
    @Query('role') role: string,
    @Query('status') status: number,
  ) {
    return this.tripsService.getUserTrips(userId, role, status);
  }

  @Get('trips/search')
  searchTrips(
    @Query('origin') origin: string,
    @Query('destination') destination: string,
    @Query('date') date: string,
    @Query('sort') sort: string,
  ) {
    return this.tripsService.searchTrips(origin, destination, date, sort);
  }

  @Get('trips/:tripId')
  getTripDetail(@Param('tripId') tripId: number) {
    return this.tripsService.getTripById(tripId);
  }

  @Post('trips')
  createTrip(@Body() body: CreateTripsDto) {
    return this.tripsService.createTrip(body);
  }
}