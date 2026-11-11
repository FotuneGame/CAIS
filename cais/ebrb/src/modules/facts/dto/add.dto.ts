import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AddDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  title: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200000)
  text: string;
}
