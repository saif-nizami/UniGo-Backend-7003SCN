import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UploadedFile,
  UseInterceptors,
  UseGuards,
  UploadedFiles,
  BadRequestException
} from '@nestjs/common';
import { VehiclesService } from './vehicles.service';
import { CreateVehicleDto } from './dto/create-vehicles.dto';
import { UpdateVehicleDto } from './dto/update-vehicles.dto';
import { FilesInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { S3Service } from '../s3/s3.service';

@UseGuards(JwtAuthGuard)
@Controller('vehicles')
export class VehiclesController {
  constructor(
    private readonly vehiclesService: VehiclesService,
    private readonly s3Service: S3Service
) {}

  @Get()
//   findAll() {
//     return this.vehiclesService.findAll();
//   }
    findAll(@Query('user_id') user_id?: string) {
    const uid = user_id ? parseInt(user_id, 10) : undefined;
    return this.vehiclesService.findAll(uid);
    }

  @Post()
  create(@Body() dto: CreateVehicleDto) {
    return this.vehiclesService.create(dto);
  }

  @Put(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.vehiclesService.remove(id);
  }

  @Put('photo/:id')
  @UseInterceptors(FilesInterceptor('files')) // 'files' = field name from frontend
    async uploadPhotos(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFiles() files: Express.Multer.File[],
    ) {
    if (!files || files.length === 0) {
        throw new BadRequestException('At least one file is required');
    }
    const urls: string[] = [];
    for (const file of files) {
        const s3Link = await this.s3Service.uploadVehiclePhoto(file);
        urls.push(s3Link);
        // append each image
        await this.vehiclesService.updatePhoto(id, s3Link);
    }
    return { message: 'Uploaded successfully', urls };
    }

}