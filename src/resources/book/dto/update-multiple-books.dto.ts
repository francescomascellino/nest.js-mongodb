import { PartialType } from '@nestjs/mapped-types';
import { CreateBookDto } from './create-book.dto';
import { Type } from 'class-transformer';
import { IsArray, ArrayMinSize, ValidateNested } from 'class-validator';

// Per aggiornare libri multipli abbiamo bisogno venga fornito anche l'ID di ogni libro
class UpdateBookWithIdDto extends PartialType(CreateBookDto) {
  id: string;
}
export class UpdateMultipleBooksDto extends PartialType(CreateBookDto) {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateBookDto)
  updates: UpdateBookWithIdDto[];
}
