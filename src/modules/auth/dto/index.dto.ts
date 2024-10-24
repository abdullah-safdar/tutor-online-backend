import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty()
  name: string;

  @ApiProperty()
  role: 'parent' | 'student';

  @ApiProperty()
  email: string;

  @ApiProperty()
  phoneNumber: string;
  @ApiProperty()
  password: string;
}

export class LoginDto {
  @ApiProperty()
  email?: string;

  @ApiProperty()
  username?: string;

  @ApiProperty()
  password: string;

  @ApiProperty()
  role: string;
}

export class VerifyEmailDto {
  @ApiProperty()
  code: string;
}

export class ForgotPasswordDto {
  @ApiProperty()
  email: string;
}

export class ResetPasswordDto {
  @ApiProperty()
  newPassword: string;

  @ApiProperty()
  confirmPassword: string;
}

export class ResetStudentPasswordDto {
  @ApiProperty()
  userId: string;

  @ApiProperty()
  currentPassword: string;

  @ApiProperty()
  newPassword: string;
}
