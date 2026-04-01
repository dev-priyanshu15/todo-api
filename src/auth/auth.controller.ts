import { Controller, Post, Body, Req, UseGuards, HttpCode } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { JwtRefreshGuard } from './guards/jwt-refresh.guard';
import type { Request } from 'express';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('signup')
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  signup(@Body() dto: SignupDto) {
    return this.authService.signup(dto);
  }

  @Post('login')
  @HttpCode(200)
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Req() req: Request) {
    return this.authService.logout((req.user as any)['id']);
  }

  @Post('refresh')
  @UseGuards(JwtRefreshGuard)
  refresh(@Req() req: Request) {
    const user = req.user as any;
    return this.authService.refreshTokens(user.id, user.email);
  }
  @Post('forgot-password')
@Throttle({ medium: { ttl: 60000, limit: 3 } })
forgotPassword(@Body() dto: ForgotPasswordDto) {
  return this.authService.forgotPassword(dto.email);
}

@Post('reset-password')
@HttpCode(200)
resetPassword(@Body() dto: ResetPasswordDto) {
  return this.authService.resetPassword(dto);
}
}