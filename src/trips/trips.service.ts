import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trips } from './trips.entity';
import { CreateTripsDto } from './dto/create-trips.dto';
import { SearchTripsQueryDto } from './dto/search-trips-query.dto';
import { Vehicle } from '../vehicles/vehicles.entity';
import { User } from '../users/users.entity';
import { Booking } from '../bookings/bookings.entity';

export const DEFAULT_TRIP_SEARCH_RADIUS_KM = 10;

@Injectable()
export class TripsService {
  constructor(
    @InjectRepository(Trips)
    private readonly tripRepo: Repository<Trips>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) {}

  async getUserTrips(userId: number, role?: string, status?: number) {
    return this.tripRepo.find({ where: { user_id: userId, status } });
  }

  async searchTrips(queryParams: SearchTripsQueryDto) {
    const {
      user_id,
      radius,
      destination_lat,
      destination_lng,
      arrival_lat,
      arrival_lng,
    } = queryParams;

    const hasDestinationLat = destination_lat !== undefined;
    const hasDestinationLng = destination_lng !== undefined;
    const hasArrivalLat = arrival_lat !== undefined;
    const hasArrivalLng = arrival_lng !== undefined;
    const hasUserId = user_id !== undefined;

    const hasDestinationCoordinates = hasDestinationLat && hasDestinationLng;
    const hasArrivalCoordinates = hasArrivalLat && hasArrivalLng;

    if (!hasUserId && !hasDestinationCoordinates && !hasArrivalCoordinates) {
      throw new BadRequestException('Provide user_id or destination and/or arrival coordinates.');
    }

    if (hasDestinationLat !== hasDestinationLng) {
      throw new BadRequestException('destination_lat and destination_lng must be provided together.');
    }

    if (hasArrivalLat !== hasArrivalLng) {
      throw new BadRequestException('arrival_lat and arrival_lng must be provided together.');
    }

    const toNumber = (value: string | undefined, field: string) => {
      if (value === undefined) {
        return undefined;
      }

      const parsed = Number(value);
      if (Number.isNaN(parsed)) {
        throw new BadRequestException(`${field} must be a valid number.`);
      }

      return parsed;
    };

    const destinationLatNum = toNumber(destination_lat, 'destination_lat');
    const destinationLngNum = toNumber(destination_lng, 'destination_lng');
    const arrivalLatNum = toNumber(arrival_lat, 'arrival_lat');
    const arrivalLngNum = toNumber(arrival_lng, 'arrival_lng');
    const userIdNum = toNumber(user_id, 'user_id');
    const radiusNum = toNumber(radius, 'radius');

    const requiresLocationSearch = hasDestinationCoordinates || hasArrivalCoordinates;
    const effectiveRadius = requiresLocationSearch
      ? radiusNum ?? DEFAULT_TRIP_SEARCH_RADIUS_KM
      : undefined;

    if (requiresLocationSearch && (effectiveRadius === undefined || effectiveRadius <= 0)) {
      throw new BadRequestException('radius must be greater than 0.');
    }

    const query = this.tripRepo
      .createQueryBuilder('trip')
      .select('trip');

    const params: Record<string, number> = {};

    if (userIdNum !== undefined) {
      query.andWhere('trip.user_id = :userId');
      params.userId = userIdNum;
    }

    if (effectiveRadius !== undefined) {
      params.radius = effectiveRadius;
    }

    let destinationDistanceExpression: string | undefined;
    let arrivalDistanceExpression: string | undefined;

    if (destinationLatNum !== undefined && destinationLngNum !== undefined) {
      params.destinationLat = destinationLatNum;
      params.destinationLng = destinationLngNum;

      destinationDistanceExpression = this.buildDistanceExpression(
        ':destinationLat',
        ':destinationLng',
        'trip.dep_lat',
        'trip.dep_lng',
      );

      query.addSelect(destinationDistanceExpression, 'destination_distance');

      query.andWhere(`${destinationDistanceExpression} <= :radius`);
    }

    if (arrivalLatNum !== undefined && arrivalLngNum !== undefined) {
      params.arrivalLat = arrivalLatNum;
      params.arrivalLng = arrivalLngNum;

      arrivalDistanceExpression = this.buildDistanceExpression(
        ':arrivalLat',
        ':arrivalLng',
        'trip.arr_lat',
        'trip.arr_lng',
      );

      query.addSelect(arrivalDistanceExpression, 'arrival_distance');

      query.andWhere(`${arrivalDistanceExpression} <= :radius`);
    }

    // Sort by proximity depending on the filters passed by the front end
    if (destinationDistanceExpression && arrivalDistanceExpression) {
      query.orderBy(`LEAST(${destinationDistanceExpression}, ${arrivalDistanceExpression})`, 'ASC');
    } else if (destinationDistanceExpression) {
      query.orderBy(destinationDistanceExpression, 'ASC');
    } else if (arrivalDistanceExpression) {
      query.orderBy(arrivalDistanceExpression, 'ASC');
    }

    query.setParameters(params);

    return query.getMany();
  }

  private buildDistanceExpression(
    latParam: string,
    lngParam: string,
    latColumn: string,
    lngColumn: string,
  ) {
    return `
        (
          6371 * ACOS(
            COS(RADIANS(${latParam})) *
            COS(RADIANS(${latColumn}::double precision)) *
            COS(RADIANS(${lngColumn}::double precision) - RADIANS(${lngParam})) +
            SIN(RADIANS(${latParam})) *
            SIN(RADIANS(${latColumn}::double precision))
          )
        )
      `;
  }

  async getTripById(id: number) {
    return this.tripRepo
      .createQueryBuilder('trip')
      .leftJoinAndMapOne('trip.vehicle', Vehicle, 'vehicle', 'vehicle.id = trip.vehicle_id')
      .leftJoinAndMapOne('trip.user', User, 'user', 'user.id = trip.user_id')
      .where('trip.id = :id', { id })
      .getOne();
  }

  async createTrip(dto: CreateTripsDto) {
    const trip = this.tripRepo.create(dto);
    return this.tripRepo.save(trip);
  }

  async cancelTrip(id: string) {
    await this.tripRepo.update(id, { status: 0 });
    await this.bookingRepo.update({ trip_id: Number(id) }, { status: 1 });
  }

  async initTrip(id: string) {
    this.tripRepo.update(id, { status: 1 });
  }
}
