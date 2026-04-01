import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateTodoDto {
  @ApiProperty({ example: 'Buy groceries', required: false })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiProperty({ example: 'Milk, eggs, bread', required: false })
  @IsOptional()
  @IsString()
  desc?: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  done?: boolean;
}