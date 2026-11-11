import { IsOptional, IsString, IsUUID } from 'class-validator';

export class StatusDto {
  @IsUUID()
  id: string;

  @IsOptional()
  @IsString()
  owner?: string;
}
