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
  @Post('bulk')
  createMultiple(@Body() createMultipleBooksDto: CreateMultipleBooksDto) {
    return this.bookService.createMultipleBooks(createMultipleBooksDto.books);
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
  @Patch('bulk')
  updateMultiple(@Body() updateMultipleBooksDto: UpdateMultipleBooksDto) {
    // TO DO: UPDATE MULTIPLE BOOKS
    return 'Update multiple books';
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string): Promise<BookDocument> {
    return this.bookService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('bulk')
  removeMultiple(@Body() deleteMultipleBooksDto: DeleteMultipleBooksDto) {
    // TO DO: REMOVE MULTIPLE BOOKS
    return 'REmove multiple books';
  }
}
