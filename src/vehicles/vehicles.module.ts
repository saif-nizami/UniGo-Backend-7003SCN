import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VehiclesService } from './vehicles.service';
import { VehiclesController } from './vehicles.controller';
import { Vehicle } from './vehicles.entity';
import { S3Module } from '../s3/s3.module'

@Module({
  imports: [TypeOrmModule.forFeature([Vehicle]), S3Module],
  controllers: [VehiclesController],
  providers: [VehiclesService],
})
export class VehiclesModule {}
