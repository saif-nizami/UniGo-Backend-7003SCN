import { Controller, Get, Param, ParseFloatPipe } from '@nestjs/common';
import { MiscService } from './misc.service';

@Controller('misc')
export class MiscController {
  constructor(private readonly miscService: MiscService) {}

  @Get('eta/:lat1/:lng1/:lat2/:lng2')
  async getTripETA(
    @Param('lat1', ParseFloatPipe) lat1: number,
    @Param('lng1', ParseFloatPipe) lng1: number,
    @Param('lat2', ParseFloatPipe) lat2: number,
    @Param('lng2', ParseFloatPipe) lng2: number,
  ) {
    return this.miscService.getETAFromCoordinates(lat1, lng1, lat2, lng2);
  }
}