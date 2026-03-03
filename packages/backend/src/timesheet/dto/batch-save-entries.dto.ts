import { IsArray, ValidateNested, IsString } from 'class-validator';
import { Type } from 'class-transformer';
import { SaveEntryDto } from './save-entry.dto';

export class BatchEntryDto extends SaveEntryDto {
  @IsString()
  entryId: string;
}

export class BatchSaveEntriesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchEntryDto)
  entries: BatchEntryDto[];
}
