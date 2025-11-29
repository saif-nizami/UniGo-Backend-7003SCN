import { Controller, Get, Query, Param, Post, Body, UseGuards } from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripsDto } from './dto/create-trips.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('trips')
export class TripsController {
  constructor(private readonly tripsService: TripsService) {}

  @Get('mytrips')
  getMyTrips(
    @Query('userId') userId: number,
    @Query('role') role: string,
    @Query('status') status: number,
  ) {
    return this.tripsService.getUserTrips(userId, role, status);
  }

  @Get('search')
  searchTrips(
    @Query('user_id') user_id: string,
    @Query('origin') origin: string,
    @Query('destination') destination: string,
    @Query('date') date: string,
    @Query('sort') sort: string,
  ) {
    return this.tripsService.searchTrips(user_id, origin, destination, date, sort);
  }

  @Get(':id')
  getTripDetail(@Param('id') id: number) {
    return this.tripsService.getTripById(id);
  }

  @Post('create-trip')
  createTrip(@Body() body: CreateTripsDto) {
    return this.tripsService.createTrip(body);
  }
}