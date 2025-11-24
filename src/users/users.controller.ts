// src/users/users.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { User } from './users.entity';

interface ApiResponse<T> {
  status: boolean;
  data: T | null;
}

@Controller('users')
export class UsersController {
  constructor(private readonly userService: UsersService) {}

  // CREATE
  @Post()
  async create(@Body() createUserDto: CreateUserDto): Promise<ApiResponse<User>> {
    const user = await this.userService.createUser(createUserDto);
    return { status: true, data: user };
  }

  // READ ALL
  @Get()
  async findAll(): Promise<ApiResponse<User[]>> {
    const users = await this.userService.findAll();
    return { status: true, data: users };
  }

  // READ ONE
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<ApiResponse<User>> {
    const user = await this.userService.findOne(+id);
    return { status: true, data: user };
  }

  // UPDATE
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateData: Partial<User>,
  ): Promise<ApiResponse<User>> {
    const user = await this.userService.updateUser(+id, updateData);
    return { status: true, data: user };
  }

  // DELETE
  @Delete(':id')
  async delete(@Param('id') id: string): Promise<ApiResponse<{ deleted: boolean }>> {
    const result = await this.userService.deleteUser(+id);
    return { status: true, data: result };
  }
}
