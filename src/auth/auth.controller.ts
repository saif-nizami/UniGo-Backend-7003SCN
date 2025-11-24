import { Controller, Post, Body, UseGuards, Request, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { User } from '../users/users.entity';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  // REGISTER
  @Post('register')
  async register(@Body() dto: CreateUserDto): Promise<{ user: User }> {
    const user = await this.authService.register(dto);
    const { password, ...safeUser } = user;
    return { user: safeUser as User };
  }

  // LOGIN
  @Post('login')
  async login(@Body() dto: { email: string; password: string }): Promise<{ accessToken: string }> {
    return this.authService.login(dto.email, dto.password);
  }

  // PROTECTED PROFILE
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Request() req) {
    const { password, ...user } = req.user;
    return { user };
  }

  // PASSWORD RESET
  @Post('reset')
  async reset(@Body() dto: CreateUserDto): Promise<{ user: User }> {
    const data = await this.authService.reset(dto.email);
    return data
  }
}