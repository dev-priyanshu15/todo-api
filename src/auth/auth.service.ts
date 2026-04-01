import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { SignupDto } from './dto/signup.dto';
import { LoginDto } from './dto/login.dto';
import { EmailProducer } from '../queue/producers/email.producer';
import * as crypto from 'crypto';
import { ResetPasswordDto } from './dto/reset-password.dto';
@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private emailProducer: EmailProducer,
  ) {}

  //signup method
  async signup(dto: SignupDto) {
    // step 1: email check
    const exists = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });
    if (exists) throw new BadRequestException('Email already registered');

    // step 2: password hash
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // step 3: user create
    const user = await this.prisma.user.create({
      data: {
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
      },
    });

    // step 4: tokens generate
    const tokens = await this.generateTokens(user.id, user.email);

    // step 5: refresh token save
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    // step 6: welcome email queue mein daalo
    await this.emailProducer.sendWelcomeEmail({
      to: user.email,
      name: user.name ?? '',
    });

    // step 7: return tokens
    return tokens;
  }

  //login method
  async login(dto: LoginDto) {
    // step 1: find user by email
    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    // step 2: check if user exists and not deleted
    if (!user || user.isDeleted) throw new UnauthorizedException('Invalid credentials');

    // step 3: compare password
    const passwordMatch = await bcrypt.compare(dto.password, user.password);
    if (!passwordMatch) throw new UnauthorizedException('Invalid credentials');

    // step 4: tokens generate
    const tokens = await this.generateTokens(user.id, user.email);

    // step 5: refresh token save
    await this.saveRefreshToken(user.id, tokens.refreshToken);

    // step 6: return tokens
    return tokens;
  }

  //logout method
  async logout(userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });
    return { message: 'Logged out successfully' };
  }

  //refresh token method
  async refreshTokens(userId: string, email: string) {
    // step 1: generate new tokens
    const tokens = await this.generateTokens(userId, email);
    // step 2: save refresh token
    await this.saveRefreshToken(userId, tokens.refreshToken);
    // step 3: return tokens
    return tokens;
  }

  private async generateTokens(userId: string, email: string) {
    const payload = { sub: userId, email };
    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_SECRET,
        expiresIn: '15m',
      }),
      this.jwtService.signAsync(payload, {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d',
      }),
    ]);
    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(userId: string, token: string) {
    const hashed = await bcrypt.hash(token, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: hashed },
    });
  }
  async forgotPassword(email: string) {
  // step 1: user dhundo
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

  // step 2: user nahi mila → same response
    if (!user) return { message: 'If that email is registered, you will receive a password reset link' };
  // step 3: random token generate
    const token = crypto.randomBytes(32).toString('hex');
  // step 4: token hash karo
    const hashedToken = crypto
  .createHash('sha256')
  .update(token)
  .digest('hex');
  // step 5: expiry set karo  // step 6: DB mein save karo
    const expiry = new Date();
    expiry.setHours(expiry.getHours() + parseInt(process.env.RESET_TOKEN_EXPIRY_HOURS || '1'));
    await this.prisma.user.update({
      where: { email },
      data: {
        resetToken: hashedToken,
        resetTokenExpiry: expiry,
      },
    });
 


  // step 7: email queue mein daalo
    await this.emailProducer.sendPasswordResetEmail({
      to: user.email,
      token,
    }); 
  // step 8: return same response
    return { message: 'If that email is registered, you will receive a password reset link' };
  }
  async resetPassword(dto: ResetPasswordDto) {
  // step 1: token hash karo
    const hashedToken = crypto
  .createHash('sha256')
  .update(dto.token)
  .digest('hex');
  // step 2: DB mein dhundo
const user = await this.prisma.user.findFirst({
  where: {
    resetToken: hashedToken,
    resetTokenExpiry: {
      gt: new Date(),
    },
  },
});

  // step 3: user nahi mila → error 
    if (!user) throw new BadRequestException('Invalid or expired token');
  // step 4: password hash karo
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

  // step 5: update karo
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
        refreshToken: null,
      },
    });

  // step 6: return message
    return { message: 'Password reset successfully' };
}
}
