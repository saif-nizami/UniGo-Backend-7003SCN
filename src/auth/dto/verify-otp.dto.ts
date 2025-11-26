// dto/verify-otp.dto.ts
import { IsString, IsIn, IsOptional, Length } from 'class-validator';

export class VerifyOtpDto {
  @IsString()
  @IsIn(['email', 'phone'])
  reset_type: 'email' | 'phone';

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsString()
  @Length(6, 6)
  otp: string;
}
