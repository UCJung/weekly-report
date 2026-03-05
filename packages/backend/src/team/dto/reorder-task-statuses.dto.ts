import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, ValidateNested } from 'class-validator';

class TaskStatusOrderItem {
  @IsString()
  id: string;

  @IsInt()
  sortOrder: number;
}

export class ReorderTaskStatusesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TaskStatusOrderItem)
  items: TaskStatusOrderItem[];
}
