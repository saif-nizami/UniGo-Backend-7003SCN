import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './vehicles.entity';
import { CreateVehicleDto } from './dto/create-vehicles.dto';
import { UpdateVehicleDto } from './dto/update-vehicles.dto';

@Injectable()
export class VehiclesService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepo: Repository<Vehicle>,
  ) {}

  async findAll(user_id?: number): Promise<Vehicle[]> {
    if (user_id) {
      return this.vehicleRepo.find({ where: { user_id } });
    }
    return this.vehicleRepo.find();
  }

  async findOne(id: number): Promise<Vehicle> {
    const vehicle = await this.vehicleRepo.findOne({ where: { id } });
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    return vehicle;
  }

  async create(dto: CreateVehicleDto): Promise<Vehicle> {
    const vehicle = this.vehicleRepo.create(dto);
    return this.vehicleRepo.save(vehicle);
  }

  async update(id: number, dto: UpdateVehicleDto): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    Object.assign(vehicle, dto);
    return this.vehicleRepo.save(vehicle);
  }

  async remove(id: number): Promise<void> {
    const vehicle = await this.findOne(id);
    await this.vehicleRepo.remove(vehicle);
  }

  async updatePhoto(id: number, newImageUrl: string): Promise<Vehicle> {
    const vehicle = await this.findOne(id);
    let images: string[] = [];
    if (vehicle.s3_imagelink) {
        try {
        images = JSON.parse(vehicle.s3_imagelink);
        } catch (e) {
        images = [];
        }
    }
    images.push(newImageUrl);
    vehicle.s3_imagelink = JSON.stringify(images);
    return this.vehicleRepo.save(vehicle);
    }

}
