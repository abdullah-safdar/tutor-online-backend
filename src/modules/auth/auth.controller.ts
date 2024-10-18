import { Controller, Post, Body, Response, Get, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Response as Res, Request as Req } from 'express';
import { Uid } from '../../decorator/uid.decorator';
import {
  RegisterDto,
  LoginDto,
  VerifyEmailDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  ResetStudentPasswordDto,
} from './dto/index.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('/get-me')
  async getMe(@Uid() uid: string, @Response() res: Res): Promise<Res> {
    return this.authService.getMe(uid, res);
  }

  @Post('/register')
  async register(
    @Body() registerUserDto: RegisterDto,
    @Response() res: Res,
  ): Promise<Res> {
    return this.authService.register(registerUserDto, res);
  }

  @Post('/login')
  async login(@Body() loginDto: LoginDto, @Response() res: Res): Promise<Res> {
    return this.authService.login(loginDto, res);
  }

  @Get('/send-verification-code')
  async sendVerificationCode(
    @Uid() uid: string,
    @Response() res: Res,
  ): Promise<Res> {
    return this.authService.sendVerificationCode(uid, res);
  }

  @Post('/verify-email')
  async verifyEmail(
    @Uid() uid: string,
    @Body() verifyEmailDto: VerifyEmailDto,
    @Response() res: Res,
  ): Promise<Res> {
    return this.authService.verifyEmail(uid, verifyEmailDto, res);
  }

  @Post('/forgot-password')
  async forgotPassword(
    @Body() forgotPasswordDto: ForgotPasswordDto,
    @Response() res: Res,
  ): Promise<Res> {
    return this.authService.forgotPassword(forgotPasswordDto, res);
  }

  @Post('/reset-password')
  async resetPassword(
    @Body() body: ResetPasswordDto,
    @Uid() uid: string,
    @Response() res: Res,
    @Request() req: Req,
  ) {
    return this.authService.resetPassword(body, uid, req, res);
  }

  @Post('/reset-student-password')
  async resetStudentPassword(
    @Body() body: ResetStudentPasswordDto,
    @Uid() uid: string,
    @Response() res: Res,
  ) {
    return this.authService.resetStudentPassword(body, uid, res);
  }
}
