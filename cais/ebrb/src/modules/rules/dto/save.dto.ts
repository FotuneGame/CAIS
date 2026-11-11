import { IsNumber, IsObject, Matches, Max, Min } from 'class-validator';

export class SaveDto {
  @Matches(/^[a-z][a-z0-9_]{1,49}$/)
  id: string;

  @IsObject()
  antecedents: Record<string, number>;

  @IsObject()
  consequent: Record<string, number>;

  @IsNumber()
  @Min(0)
  weight: number = 1;

  @IsNumber()
  @Min(0)
  @Max(1)
  reliability: number = 1;
}
