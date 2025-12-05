import { Injectable } from '@nestjs/common';
import { getETA_OSRM } from '../utils/eta.utils'; // adjust path if necessary

@Injectable()
export class MiscService {
  async getETAFromCoordinates(depLat: number, depLng: number, arrLat: number, arrLng: number) {
    const result = await getETA_OSRM(depLat, depLng, arrLat, arrLng);
    return result;
  }
}
