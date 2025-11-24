export function generateOtp(previousOtp?: string): string {
  let otp: string;
  do {
    otp = Math.floor(100000 + Math.random() * 900000).toString();
  } while (otp === previousOtp);
  return otp;
}