import { IsArray, IsString } from 'class-validator';

export class ReorderPartsDto {
  @IsArray()
  @IsString({ each: true })
  orderedIds: string[];
}
