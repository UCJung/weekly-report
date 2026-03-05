import { IsArray, IsString, IsNotEmpty, ArrayNotEmpty } from 'class-validator';

export class ReorderPersonalTasksDto {
  @IsString()
  @IsNotEmpty()
  teamId: string;

  @IsArray()
  @ArrayNotEmpty()
  @IsString({ each: true })
  orderedIds: string[];
}
