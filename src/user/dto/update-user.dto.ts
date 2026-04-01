import { IsOptional, IsString, IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserDto {
  @ApiProperty({ example: 'Priyanshu Singh', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'priyanshu@gmail.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;
}