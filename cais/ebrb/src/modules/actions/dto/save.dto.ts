import {
  IsBoolean,
  IsNotEmpty,
  IsString,
  Matches,
  MaxLength,
} from 'class-validator';

export class SaveDto {
  @Matches(/^[\w.:-]{1,100}$/)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(500)
  description: string;

  @IsBoolean()
  safe: boolean = true;
}
