import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trips } from './trips.entity';
import { CreateTripsDto } from './dto/create-trips.dto';
import { SearchTripsQueryDto } from './dto/search-trips-query.dto';
import OpenAI from 'openai';
import { Vehicle } from '../vehicles/vehicles.entity';
import { User } from '../users/users.entity';
import { Booking } from '../bookings/bookings.entity';
import { NaturalLanguageTripResponse } from './dto/natural-language-trip.dto';

export const DEFAULT_TRIP_SEARCH_RADIUS_KM = 10;

@Injectable()
export class TripsService {
  private readonly openAIClient?: OpenAI;

  constructor(
    @InjectRepository(Trips)
    private readonly tripRepo: Repository<Trips>,
    @InjectRepository(Booking)
    private readonly bookingRepo: Repository<Booking>,
  ) {
    if (process.env.OPENAI_API_KEY) {
      this.openAIClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    }
  }

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
    const tripId = Number(id);
    if (!id || Number.isNaN(tripId)) {
      throw new BadRequestException('A valid trip id is required to cancel a trip.');
    }

    await this.tripRepo.update(tripId, { status: 0 });
    await this.bookingRepo.update({ trip_id: tripId }, { status: 1 });
  }

  async initTrip(id: string) {
    this.tripRepo.update(id, { status: 1 });
  }

  async parseNaturalLanguageTrip(text: string): Promise<NaturalLanguageTripResponse> {
    const normalized = text?.trim() ?? '';
    if (!normalized) {
      return this.buildEmptyNaturalLanguageResponse();
    }

    if (this.openAIClient) {
      const referenceDate = new Date();
      const timezone = 'Europe/London';
      const systemPrompt = `You are a helpful assistant that extracts structured trip details from natural language. Respond with a compact JSON object using keys departure_location, arrival_location, seats, departure_time, and price. Use null for any field you cannot confidently infer. Use ISO 8601 for departure_time. departure_location and arrival_location should describe places (city, address, coordinate string) instead of inventing numbers when no precise coordinates are provided. Today's reference date/time is ${referenceDate.toISOString()} (${timezone}). Interpret phrases like "tomorrow" or "next Monday" relative to that moment and assume the United Kingdom timezone unless the user explicitly states otherwise.`;
      try {
        const llmResponse = await this.openAIClient.chat.completions.create({
          model: process.env.OPENAI_TRIP_MODEL ?? 'gpt-4o-mini',
          temperature: 0,
          messages: [
            {
              role: 'system',
              content: systemPrompt,
            },
            { role: 'user', content: normalized },
          ],
        });

        const content = llmResponse.choices?.[0]?.message?.content;
        const raw = Array.isArray(content)
          ? content
              .map((part: any) => {
                if (typeof part === 'string') {
                  return part;
                }
                if (part?.type === 'text') {
                  return part.text ?? '';
                }
                return '';
              })
              .join('')
          : content ?? '';

        const parsed = this.safeParseJSON(raw);
        const normalizedResponse = this.normalizeLLMResponse(parsed);
        if (normalizedResponse) {
          return normalizedResponse;
        }
      } catch (error) {
        console.error('Error parsing natural language trip:', error);
      }
    }

    return this.buildEmptyNaturalLanguageResponse();
  }

  private normalizeLLMResponse(payload: unknown): NaturalLanguageTripResponse | null {
    if (!payload || typeof payload !== 'object') {
      return null;
    }

    const data = payload as Record<string, unknown>;

    const toStringOrNull = (value: unknown) => {
      if (value === null || value === undefined) {
        return null;
      }
      if (typeof value === 'string') {
        const trimmed = value.trim();
        return trimmed ? trimmed : null;
      }

      if (typeof value === 'number' && Number.isFinite(value)) {
        return String(value);
      }

      return null;
    };

    const toNumberOrNull = (value: unknown) => {
      if (value === null || value === undefined || value === '') {
        return null;
      }

      const parsed = Number(value);
      return Number.isNaN(parsed) ? null : parsed;
    };

    const toIsoOrNull = (value: unknown) => {
      if (typeof value !== 'string' || !value.trim()) {
        return null;
      }
      const parsed = new Date(value);
      return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString();
    };

    return {
      departure_location: toStringOrNull(data.departure_location),
      arrival_location: toStringOrNull(data.arrival_location),
      seats: toNumberOrNull(data.seats),
      departure_time: toIsoOrNull(data.departure_time),
      price: toNumberOrNull(data.price),
    };
  }

  private safeParseJSON(raw: string) {
    if (!raw) {
      return null;
    }

    const trimmed = raw.trim();
    if (!trimmed) {
      return null;
    }

    try {
      return JSON.parse(trimmed);
    } catch (err) {
      const firstBrace = trimmed.indexOf('{');
      const lastBrace = trimmed.lastIndexOf('}');
      if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
        try {
          return JSON.parse(trimmed.slice(firstBrace, lastBrace + 1));
        } catch {
          return null;
        }
      }
      return null;
    }
  }

  private buildEmptyNaturalLanguageResponse(): NaturalLanguageTripResponse {
    return {
      departure_location: null,
      arrival_location: null,
      seats: null,
      departure_time: null,
      price: null,
    };
  }
}
