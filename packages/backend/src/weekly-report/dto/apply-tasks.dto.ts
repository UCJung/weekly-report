import { IsArray, IsString, IsEnum } from 'class-validator';

export class ApplyTasksDto {
  @IsArray()
  @IsString({ each: true })
  taskIds: string[];

  @IsEnum(['replace', 'append'])
  appendMode: 'replace' | 'append';

  @IsString()
  teamId: string;
}
