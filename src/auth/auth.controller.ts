import { Controller, Post, Body, UseGuards, Request, Get, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { VerifyOtpDto } from './dto/verify-otp.dto';
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
  async reset(@Body() dto: ResetPasswordDto): Promise<any> {
    let data: any;
    if (dto.reset_type === 'email') {
      if (!dto.email) {
        throw new BadRequestException('Email is required for reset by email');
      }
      data = await this.authService.reset_by_email(dto.email);
    } else if (dto.reset_type === 'phone') {
      if (!dto.phone_number) {
        throw new BadRequestException('Phone number is required for reset by phone');
      }
      data = await this.authService.reset_by_phone(dto.phone_number);
    } else {
      throw new BadRequestException('Invalid reset type');
    }
    return data;
  }

  // OTP VERIFY
  @Post('verify')
  async verifyOtp(@Body() dto: VerifyOtpDto) {
    let data: any;
    if (dto.reset_type === 'email') {
      if (!dto.email) {
        throw new BadRequestException('Email is required for email verification');
      }
      data = await this.authService.verifyOtpByEmail(dto.email, dto.otp);
    } 
    else if (dto.reset_type === 'phone') {
      if (!dto.phone_number) {
        throw new BadRequestException('Phone number is required for phone verification');
      }
      data = await this.authService.verifyOtpByPhone(dto.phone_number, dto.otp);
    } 
    else {
      throw new BadRequestException('Invalid reset type');
    }
    return {
      status: true,
      message: 'OTP verified successfully',
      user: data,
    };
  }

}