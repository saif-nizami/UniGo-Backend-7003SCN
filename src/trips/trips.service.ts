import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trips } from './trips.entity';
import { CreateTripsDto } from './dto/create-trips.dto';

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trips)
    private readonly tripRepo: Repository<Trips>,
  ) {}

  async getUserTrips(userId: number, role?: string, status?: number) {
    return this.tripRepo.find({ where: { user_id: userId, status } });
  }

  async searchTrips(
    user_id: string,
    origin?: string,
    destination?: string,
    date?: string,
    sort?: string,
  ) {
    const query = this.tripRepo
      .createQueryBuilder('trip')
      .where('trip.user_id = :user_id', { user_id });

    // Optional origin
    if (origin) {
      query.andWhere('trip.departure_location ILIKE :origin', {
        origin: `%${origin}%`,
      });
    }

    // Optional destination
    if (destination) {
      query.andWhere('trip.arrival_location ILIKE :destination', {
        destination: `%${destination}%`,
      });
    }

    // Optional date
    if (date) {
      query.andWhere('DATE(trip.departure_time) = :date', { date });
    }

    // Optional sorting
    if (sort === 'price') {
      query.orderBy('trip.price', 'ASC');
    } else if (sort === 'time') {
      query.orderBy('trip.departure_time', 'ASC');
    }

    return query.getMany();
  }

  async getTripById(id: number) {
    return this.tripRepo.findOne({ where: { id } });
  }

  async createTrip(dto: CreateTripsDto) {
    const trip = this.tripRepo.create(dto);
    return this.tripRepo.save(trip);
  }
}
