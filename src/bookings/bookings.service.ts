import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Booking } from './bookings.entity';
import { Trips } from '../trips/trips.entity';
import { CreateBookingDto } from './dto/create-bookings.dto';
import { BookingRating } from './bookings-rating.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
    @InjectRepository(Trips)
    private readonly tripRepo: Repository<Trips>,
    @InjectRepository(BookingRating)
    private readonly ratingRepo: Repository<BookingRating>,
    private readonly dataSource: DataSource,
  ) {}

  async createBooking(tripId: number, dto: CreateBookingDto) {
    const trip = await this.tripRepo.findOne({ where: { id: tripId } });
    if (!trip) throw new NotFoundException('Trip not found');
    // Basic availability check
    if (trip.availability <= 0) {
      throw new BadRequestException('No seats available');
    }
    // Price fallback to trip price if not provided
    const price = dto.price ?? Number(trip.price);
    // Use transaction to decrement availability and create booking
    return await this.dataSource.transaction(async (manager) => {
      const booking = manager.create(Booking, {
        trip_id: tripId,
        user_id: dto.user_id,
        seat: dto.seat,
        price,
        status: 0,
        created_by: dto.user_id,
        pickup_lat_lng: dto.pickup_lat_lng,
        pickup_point: dto.pickup_point
      });
      const saved = await manager.save(booking);
      // decrement availability
      await manager.update(
        Trips,
        { id: tripId },
        { availability: trip.availability - 1 },
      );
      return saved;
    });
  }

  async getBookingById(id: number) {
    const booking = await this.bookingRepo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('Booking not found');
    return booking;
  }

  async cancelBooking(id: number, userId?: number) {
    const booking = await this.getBookingById(id);
    if (booking.status === 1)
      throw new BadRequestException('Booking already cancelled');
    // Mark cancelled and increment trip availability
    await this.dataSource.transaction(async (manager) => {
      booking.status = 1;
      booking.modified_at = new Date();
      await manager.save(booking);
      // increment availability on trip
      const trip = await manager.findOne(Trips, {
        where: { id: booking.trip_id },
      });
      if (trip) {
        await manager.update(
          Trips,
          { id: trip.id },
          { availability: trip.availability + 1 },
        );
      }
    });
    return { success: true };
  }

  async rateBooking(bookingId: number, rating: number, comment?: string) {
    const booking = await this.getBookingById(bookingId);
    if (booking.status !== 2 && booking.status !== 0) {
      // allow rating if completed (2) or active (0) — you can adjust logic
    }
    const ratingEntity = this.ratingRepo.create({
      booking_id: bookingId,
      rating,
      comment: comment ?? "N/A",
    });
    return this.ratingRepo.save(ratingEntity);
  }

  async getReceipt(bookingId: number) {
    const booking = await this.bookingRepo.findOne({
      where: { id: bookingId },
    });
    if (!booking) throw new NotFoundException('Booking not found');
    const trip = await this.tripRepo.findOne({
      where: { id: booking.trip_id },
    });
    const receipt = {
      booking: {
        id: booking.id,
        seat: booking.seat,
        price: Number(booking.price),
        status: booking.status,
        created_at: booking.created_at,
      },
      trip: trip
        ? {
            id: trip.id,
            departure_location: trip.departure_location,
            arrival_location: trip.arrival_location,
            departure_time: trip.departure_time,
            arrival_time: trip.arrival_time,
            vehicle_id: trip.vehicle_id,
          }
        : null,
    };
    return receipt;
  }
}
