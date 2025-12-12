import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, In } from 'typeorm';
import { Booking } from './bookings.entity';
import { Trips } from '../trips/trips.entity';
import { User } from '../users/users.entity';
import { Vehicle } from '../vehicles/vehicles.entity';
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
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
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

    const trip = await this.tripRepo
      .createQueryBuilder('trip')
      .leftJoinAndMapOne('trip.user', User, 'trip_user', 'trip_user.id = trip.user_id')
      .leftJoinAndMapOne(
        'trip.vehicle',
        Vehicle,
        'trip_vehicle',
        'trip_vehicle.id = trip.vehicle_id',
      )
      .where('trip.id = :tripId', { tripId: booking.trip_id })
      .getOne();

    booking.trip = trip ?? undefined;
    return booking;
  }

  async getBookingByTripID(trip_id: number) {
    const booking = await this.bookingRepo.findBy({ trip_id });
    if (!booking) throw new NotFoundException('Booking not found');
    let returnData: { booking_data: Booking, user_data: any }[] = []
    for (let i = 0; i < booking.length; i++) {
      let booking_data = booking[i]
      let user_data = {}
      if (booking[i].user_id && +booking[i].user_id > 0) {
        const user = await this.userRepo.findOneBy({ id: booking[i].user_id });
        if (user) user_data = user
      }
      returnData.push({booking_data: booking[i], user_data: user_data})
    }
    return returnData
  }

  async getUserBookedTrips(userId: number) {
    if (!userId) {
      throw new BadRequestException('user_id is required');
    }

    const bookings = await this.bookingRepo.findBy({ user_id: userId });
    if (!bookings.length) {
      return [];
    }

    const tripIds = [...new Set(bookings.map((booking) => booking.trip_id))];
    const trips = await this.tripRepo.findBy({ id: In(tripIds) });
    const tripMap = new Map(trips.map((trip) => [trip.id, trip]));

    return bookings.map((booking) => ({
      trip: tripMap.get(booking.trip_id) ?? null,
      booking_id: booking.id,
      booking_status: booking.status,
    }));
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
            departure_location: trip.dep_lat + '|' + trip.dep_lng,
            arrival_location: trip.arr_lat + '|' + trip.arr_lng,
            departure_time: trip.dep_time,
            arrival_time: trip.arr_time,
            vehicle_id: trip.vehicle_id,
          }
        : null,
    };
    return receipt;
  }
}
