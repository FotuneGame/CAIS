import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class StartDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  task: string;

  @IsOptional()
  @IsString()
  owner?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(300)
  wait?: number;
}
