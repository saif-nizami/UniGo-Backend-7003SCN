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
    type: string,
    lat: string,
    lng: string,
    radius: string,
  ) {
    const userIdNum = Number(user_id);
    const latNum = Number(lat);
    const lngNum = Number(lng);
    const radiusNum = Number(radius);

    const query = this.tripRepo.createQueryBuilder('trip');

    // Filter by user
    if (userIdNum) {
      query.andWhere('trip.user_id = :userId', { userId: userIdNum });
    }

    // Determine which column to use for distance filtering
    let columnLat: string | null = null;
    let columnLng: string | null = null;

    if (type) {
      if (type === 'dep') {
        columnLat = 'trip.dep_lat';
        columnLng = 'trip.dep_lng';
      } else if (type === 'arr') {
        columnLat = 'trip.arr_lat';
        columnLng = 'trip.arr_lng';
      } else {
        throw new Error("Invalid type — must be 'dep' or 'arr'");
      }
    }

    // Distance filter ONLY if type is provided
    if (columnLat && columnLng) {
      query.andWhere(
        `
        (
          6371 * ACOS(
            COS(RADIANS(:lat)) *
            COS(RADIANS(${columnLat}::double precision)) *
            COS(RADIANS(${columnLng}::double precision) - RADIANS(:lng)) +
            SIN(RADIANS(:lat)) *
            SIN(RADIANS(${columnLat}::double precision))
          )
        ) <= :radius
      `,
        {
          lat: latNum,
          lng: lngNum,
          radius: radiusNum,
        },
      );
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

  async cancelTrip(id: string) {
    this.tripRepo.update(id, { status: 0 });
  }

  async initTrip(id: string) {
    this.tripRepo.update(id, { status: 1 });
  }
}
