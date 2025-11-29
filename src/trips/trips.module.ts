import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trips } from './trips.entity';
import { TripsService } from './trips.service';
import { TripsController } from './trips.controller';

@Module({
imports: [TypeOrmModule.forFeature([Trips])],
controllers: [TripsController],
providers: [TripsService],
})
export class TripsModule {}