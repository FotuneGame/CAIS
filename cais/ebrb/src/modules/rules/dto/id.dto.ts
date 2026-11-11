import { Matches } from 'class-validator';

export class IdDto {
  @Matches(/^[a-z][a-z0-9_]{1,49}$/)
  id: string;
}
