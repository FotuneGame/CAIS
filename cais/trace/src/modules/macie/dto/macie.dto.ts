import {
  IsBoolean,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';
import { VERBOSITY } from '../constants/macie.constants';
import type { Verbosity } from '../types/macie.types';

export class MacieDto {
  @IsOptional() @IsInt() @Min(1) @Max(10080) minutes?: number;
  @IsOptional() @IsInt() @Min(1) @Max(100) k?: number;
  @IsOptional() @IsInt() @Min(10) @Max(1000) b?: number;
  @IsOptional() @IsNumber() @Min(0) epsilon?: number;
  @IsOptional() @IsNumber() @Min(0) synergy?: number;
  @IsOptional() @IsNumber() si?: number;
  @IsOptional() @IsInt() seed?: number;
  @IsOptional() @IsInt() @Min(1) @Max(10000) m?: number;
  @IsOptional() @IsBoolean() shapley?: boolean;
  @IsOptional() @IsIn(VERBOSITY) verbosity?: Verbosity;
}
