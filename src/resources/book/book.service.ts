import { Model } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
// import { CreateBookDto } from './dto/create-book.dto';
// import { UpdateBookDto } from './dto/update-book.dto';
import { Book } from './schemas/book.schema';

@Injectable()
export class BookService {
  constructor(@InjectModel(Book.name) private bookModel: Model<Book>) {}
  /*   create(createBookDto: CreateBookDto) {
    return 'This action adds a new book';
  } */

  async findAll(): Promise<Book[]> {
    console.log('find all');
    const books = await this.bookModel.find().exec();
    console.log(books);
    return books;
  }

  async findOne(_id: string) {
    const book = await this.bookModel.findById(_id).exec();
    if (!book) {
      throw new NotFoundException(`Book with ID ${_id} not found`);
    }
    return book;
  }

  /*   update(id: number, updateBookDto: UpdateBookDto) {
    return `This action updates a #${id} book`;
  } */

  remove(id: string) {
    return `This action removes a #${id} book`;
  }
}
