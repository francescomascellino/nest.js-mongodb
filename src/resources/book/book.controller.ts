import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { CreateMultipleBooksDto } from './dto/create-multiple-books.dto';
import { DeleteMultipleBooksDto } from './dto/delete-multiple-books.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { UpdateMultipleBooksDto } from './dto/update-multiple-books.dto';
import { BookDocument } from './schemas/book.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('book')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() createBookDto: CreateBookDto) {
    return this.bookService.create(createBookDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(): Promise<BookDocument[]> {
    return this.bookService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get('loaned')
  getLoanedBooks(): Promise<BookDocument[]> {
    return this.bookService.loanedBooks();
  }

  @UseGuards(JwtAuthGuard)
  @Get('available')
  async getAvailableBooks(): Promise<BookDocument[]> {
    return this.bookService.availableBooks();
  }

  @UseGuards(JwtAuthGuard)
  @Get('delete')
  async getSoftDeleted(): Promise<BookDocument[]> {
    return this.bookService.getSoftDeleted();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<BookDocument> {
    return this.bookService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateBookDto: UpdateBookDto,
  ): Promise<BookDocument> {
    return this.bookService.update(id, updateBookDto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('bulk/create')
  createMultiple(
    @Body() createMultipleBooksDto: CreateMultipleBooksDto,
  ): Promise<{ createdBooks: BookDocument[]; errors: any[] }> {
    return this.bookService.createMultipleBooks(createMultipleBooksDto.books);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('bulk/update')
  updateMultiple(
    @Body() updateMultipleBooksDto: UpdateMultipleBooksDto,
  ): Promise<{ updatedBooks: BookDocument[]; errors: any[] }> {
    return this.bookService.updateMultipleBooks(updateMultipleBooksDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('/delete/:id')
  remove(@Param('id') id: string): Promise<BookDocument> {
    return this.bookService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('delete/:id')
  softDelete(@Param('id') id: string): Promise<BookDocument> {
    return this.bookService.softDelete(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('restore/:id')
  restore(@Param('id') id: string): Promise<BookDocument> {
    return this.bookService.restore(id);
  }

  /**
   * Rimuove più libri dal database.
   * Questo metodo è protetto da autenticazione JWT.
   *
   * @param deleteMultipleBooksDto Un DTO che contiene un array di ID di libri da eliminare.
   * @returns Una promessa che risolve un oggetto contenente due array:
   *          - `deletedBooks`: libri eliminati con successo
   *          - `errors`: errori riscontrati durante l'eliminazione dei libri
   */
  @UseGuards(JwtAuthGuard)
  @Delete('bulk/delete')
  removeMultiple(
    @Body() deleteMultipleBooksDto: DeleteMultipleBooksDto,
  ): Promise<{ deletedBooks: BookDocument[]; errors: any[] }> {
    return this.bookService.removeMultipleBooks(deleteMultipleBooksDto.bookIds);
  }
}
