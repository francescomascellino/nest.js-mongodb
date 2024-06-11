import { IsArray, IsString } from 'class-validator';

export class DeleteMultipleBooksDto {
  @IsArray()
  @IsString({ each: true })
  bookIds: string[];
}
