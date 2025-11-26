// reset-password.dto.ts
import { IsEmail, IsOptional, IsString, IsIn } from 'class-validator';

export class ResetPasswordDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone_number?: string;

  @IsString()
  @IsIn(['email', 'phone'])
  reset_type: 'email' | 'phone';
}
