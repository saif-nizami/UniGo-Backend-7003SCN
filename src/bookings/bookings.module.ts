import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingsController } from './bookings.controller';
import { BookingsService } from './bookings.service';
import { Booking } from './bookings.entity';
import { Trips } from '../trips/trips.entity';
import { User } from '../users/users.entity';
import { BookingRating } from './bookings-rating.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, Trips, BookingRating, User])],
  controllers: [BookingsController],
  providers: [BookingsService],
})
export class BookingsModule {}
