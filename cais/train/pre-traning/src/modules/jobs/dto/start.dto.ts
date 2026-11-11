import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

export class OptionsDto {
  @IsOptional() @IsInt() @Min(64) @Max(32768) context?: number;
  @IsOptional() @IsInt() @Min(1) @Max(8192) batch?: number;
  @IsOptional() @IsInt() @Min(1) @Max(100) epochs?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1) lr?: number;
  @IsOptional() @IsBoolean() evaluate?: boolean;

  @IsOptional()
  @IsIn(['Q4_K_M', 'Q5_K_M', 'Q6_K', 'Q8_0', 'none'])
  quantize?: string;
}

export class StartDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  base: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  dataset: string;

  @Matches(/^[\w.-]{1,100}$/)
  model: string;

  @IsOptional()
  @ValidateNested()
  @Type(() => OptionsDto)
  options?: OptionsDto;
}
