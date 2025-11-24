import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'UniGo Backend APIs : CU 7003SCN : 2025';
  }
}
