import { IsUUID } from 'class-validator';

export class StatusDto {
  @IsUUID()
  id: string;
}
