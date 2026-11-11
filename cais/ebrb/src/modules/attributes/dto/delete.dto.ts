import { Matches } from 'class-validator';

export class DeleteDto {
  @Matches(/^[a-z][a-z0-9_]{1,49}$/)
  name: string;
}
