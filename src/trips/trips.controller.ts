import { Controller, Get, Query, Param, Post, Put, Body, UseGuards } from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripsDto } from './dto/create-trips.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchTripsQueryDto } from './dto/search-trips-query.dto';

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
  searchTrips(@Query() query: SearchTripsQueryDto) {
    return this.tripsService.searchTrips(query);
  }

  @Get(':id')
  getTripDetail(@Param('id') id: number) {
    return this.tripsService.getTripById(id);
  }

  @Post('create-trip')
  createTrip(@Body() body: CreateTripsDto) {
    return this.tripsService.createTrip(body);
  }

  @Post('cancel')
  cancelTrip(@Body() body: { id: string }) {
    return this.tripsService.cancelTrip(body.id);
  }

  @Put('init')
  initTrip(@Body() body: { id: string }) {
    return this.tripsService.initTrip(body.id);
  }
}
