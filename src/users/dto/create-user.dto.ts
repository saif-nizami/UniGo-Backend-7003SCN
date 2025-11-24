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
  created_by?: number;
}