import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './users.entity';
import { CreateUserDto } from './dto/create-user.dto';

interface ApiResponse<T> {
  status: boolean;
  data: T;
}

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createUser(createUserDto: CreateUserDto): Promise<ApiResponse<User>> {
    try {
      const user = this.userRepository.create(createUserDto);
      let savedUser = await this.userRepository.save(user);
      return { status: true, data: savedUser } 
    } catch (error) {
        throw new BadRequestException(error.message || 'Failed to create user!');
    }
  }

}
