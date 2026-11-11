import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class AprioriDto {
  @IsOptional() @IsInt() @Min(1) @Max(10080) minutes?: number;
  @IsOptional() @IsNumber() @Min(0) @Max(1) minSupport?: number;
  @IsOptional() @IsInt() @Min(1) @Max(6) maxSize?: number;
  @IsOptional() @IsInt() @Min(1) @Max(20) clusters?: number;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100000)
  observations?: Record<string, number>[];

  @IsOptional()
  @IsArray()
  expertPairs?: string[][];

  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  weights?: number[];
}
