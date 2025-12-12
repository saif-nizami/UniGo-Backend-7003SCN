import { Controller, Get, Query, Param, Post, Put, Body, UseGuards, ParseIntPipe } from '@nestjs/common';
import { TripsService } from './trips.service';
import { CreateTripsDto } from './dto/create-trips.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SearchTripsQueryDto } from './dto/search-trips-query.dto';
import { NaturalLanguageTripDto } from './dto/natural-language-trip.dto';

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

  @Post('natural-language')
  parseNaturalLanguage(@Body() payload: NaturalLanguageTripDto) {
    return this.tripsService.parseNaturalLanguageTrip(payload.text);
  }

  @Post(':tripId/cancel')
  cancelTrip(
    @Param('tripId', ParseIntPipe) tripId: number,
  ) {
    return this.tripsService.cancelTrip(tripId);
  }

  @Put('init')
  initTrip(@Body() body: { id: string }) {
    return this.tripsService.initTrip(body.id);
  }
}
