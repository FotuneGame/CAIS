import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';

export class FilterDto {
  @IsOptional() @IsString() agent?: string;
  @IsOptional() @IsInt() @Min(1) @Max(10080) minutes?: number;
  @IsOptional() @IsInt() @Min(1) @Max(10000) limit?: number;
}
