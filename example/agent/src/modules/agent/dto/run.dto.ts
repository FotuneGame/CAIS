import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RunDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(4000)
  task: string;
}
