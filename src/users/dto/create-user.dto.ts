export class CreateUserDto {
  name: string;
  email: string;
  password: string;
  phone_number?: string;
  dob?: string; // or Date
  status?: number;
  verify_status?: number;
  referrer_code?: string;
  type?: number;
  created_at?: Date;
  created_by?: number;
  modified_at?: Date;
  modified_by?: number;
  email_verify?: string;
  mobile_verify?: string;
}