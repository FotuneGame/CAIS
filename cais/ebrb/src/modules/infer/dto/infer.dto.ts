import { Type } from 'class-transformer';
import {
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class ThresholdsDto {
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  ignorance?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  conflict?: number;
}

export class InferDto {
  @IsOptional()
  @IsString()
  @MaxLength(8000)
  input?: string;

  @IsOptional()
  @IsObject()
  attributes?: Record<string, { value: number; confidence?: number }>;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  action?: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => ThresholdsDto)
  thresholds?: ThresholdsDto;
}
