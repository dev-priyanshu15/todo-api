import { IsString, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTodoDto {
  @ApiProperty({ example: 'Buy groceries' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Milk, eggs, bread', required: false })
  @IsOptional()
  @IsString()
  desc?: string;
}