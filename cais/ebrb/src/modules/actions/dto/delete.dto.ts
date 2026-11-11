import { Matches } from 'class-validator';

export class DeleteDto {
  @Matches(/^[\w.:-]{1,100}$/)
  name: string;
}
