import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import { SaveDto as ActionDto } from '../../actions/dto/save.dto';
import { SaveDto as AttributeDto } from '../../attributes/dto/save.dto';
import { SaveDto as RuleDto } from '../../rules/dto/save.dto';

export class BaseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AttributeDto)
  attributes: AttributeDto[] = [];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ActionDto)
  actions: ActionDto[] = [];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RuleDto)
  rules: RuleDto[] = [];
}
