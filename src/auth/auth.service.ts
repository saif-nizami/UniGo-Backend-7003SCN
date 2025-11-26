import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { User } from '../users/users.entity';
import { SesService } from '../ses/ses.service';
import { generateOtp } from '../utils/auth.utils';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private sesService: SesService,
  ) {}

  async register(dto: CreateUserDto): Promise<User> {
    const existing = await this.usersService.findOneByEmail(dto.email);
    if (existing) throw new UnauthorizedException('Email already exists');
    return this.usersService.createUser(dto);
  }

  async login(email: string, password: string): Promise<{ accessToken: string }> {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid credentials');

    const payload = { sub: user.id, email: user.email };
    return { accessToken: this.jwtService.sign(payload) };
  }

  async reset_by_email(email: string): Promise<any> {
    const { ...user } = await this.usersService.findOneByEmail(email);
    if (!user) throw new UnauthorizedException('User not found!');

    const newOTP = generateOtp(user.email_verify || "000000");
    await this.usersService.updateUser(user.id, {email_verify: newOTP})
    let sesRes = await this.sesService.sendEmail(
      user.email,
      'OTP to reset your UniGo account password!',
      `Hello ${user.name},\n\n${newOTP} is your OTP to reset your password!`,
    );
    // console.log('sesRes ::: ', sesRes)
    if (sesRes && sesRes['$metadata'] && sesRes['$metadata']['httpStatusCode'] && sesRes['$metadata']['httpStatusCode'] == 200) {
      return user
    }
    throw new BadRequestException('Unable to send OTP! Please try again later.');
  }

  async reset_by_phone(phone_number: string): Promise<any> {
    const { ...user } = await this.usersService.findOneByPhone(phone_number);
    if (!user) throw new UnauthorizedException('User not found!');

    const newOTP = generateOtp(user.email_verify || "000000");
    await this.usersService.updateUser(user.id, {mobile_verify: newOTP})
    let sesRes = await this.sesService.sendEmail(
      user.email,
      'OTP to reset your UniGo account password!',
      `Hello ${user.name},\n\n${newOTP} is your OTP to reset your password!`,
    );
    // console.log('sesRes ::: ', sesRes)
    if (sesRes && sesRes['$metadata'] && sesRes['$metadata']['httpStatusCode'] && sesRes['$metadata']['httpStatusCode'] == 200) {
      return user
    }
    throw new BadRequestException('Unable to send OTP! Please try again later.');
  }

  async verifyOtpByEmail(email: string, otp: string) {
    const user = await this.usersService.findOneByEmail(email);
    if (!user) throw new UnauthorizedException('User not found');
    if (user.email_verify.toString() !== otp) {
      throw new UnauthorizedException('Invalid OTP!');
    }
    await this.usersService.updateUser(user.id, { email_verify: "0", verify_status: 1 });
    return user;
  }

  async verifyOtpByPhone(phone: string, otp: string) {
    const user = await this.usersService.findOneByPhone(phone);
    if (!user) throw new UnauthorizedException('User not found');
    if (user.mobile_verify.toString() !== otp) {
      throw new UnauthorizedException('Invalid OTP');
    }
    await this.usersService.updateUser(user.id, { mobile_verify: "0", verify_status: 1 });
    return user;
  }

}
