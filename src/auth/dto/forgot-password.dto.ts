import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'priyanshu@gmail.com' })
  @IsEmail()
  email: string;
}