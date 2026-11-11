import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  agent: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  type: string;

  @IsOptional() @IsString() time?: string;
  @IsOptional() @IsString() run?: string;
  @IsOptional() @IsString() tool?: string;
  @IsOptional() @IsString() decision?: string;
  @IsOptional() @IsString() status?: string;
  @IsOptional() @IsNumber() durationMs?: number;
}
