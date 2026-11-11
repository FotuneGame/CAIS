import { IsIn, IsNotEmpty, IsString, MaxLength } from 'class-validator';
import {
  defaultPrompts,
  type PromptName,
} from '../constants/prompts.constants';

export class UpdateDto {
  @IsIn(Object.keys(defaultPrompts))
  name: PromptName;

  @IsString()
  @IsNotEmpty()
  @MaxLength(8000)
  text: string;
}
