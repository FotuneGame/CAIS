import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsString,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class SaveDto {
  @Matches(/^[a-z][a-z0-9_]{1,49}$/)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @IsNumber()
  @Min(0)
  weight: number = 1;

  @IsArray()
  @ArrayMinSize(2)
  @IsNumber({}, { each: true })
  referential: number[] = [0, 0.5, 1];

  @IsBoolean()
  required: boolean = true;
}
