import { IsArray, IsString } from 'class-validator';

export class ReorderProjectsDto {
  @IsString()
  teamId: string;

  @IsArray()
  @IsString({ each: true })
  orderedIds: string[];
}
