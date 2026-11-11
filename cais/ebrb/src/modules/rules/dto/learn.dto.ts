import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsObject,
  IsString,
  ValidateNested,
} from 'class-validator';

export class SampleDto {
  @IsObject()
  attributes: Record<string, number>;

  @IsString()
  @IsNotEmpty()
  label: string;
}

export class LearnDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SampleDto)
  samples: SampleDto[];
}
