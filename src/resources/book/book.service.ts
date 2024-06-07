import { Model } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book, BookDocument } from './schemas/book.schema';
import { User, UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class BookService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,

    // Inietta il modello user che abbiamo reso disponibile in UserModule e importato in BookModule
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  async create(createBookDto: CreateBookDto) {
    console.log(`Create new Book`);

    const newBook = new this.bookModel(createBookDto);

    return await newBook.save();
  }

  async findAll(): Promise<BookDocument[]> {
    console.log('Find all Books');

    const books = await this.bookModel.find().exec();

    return books;
  }

  async findOne(id: string): Promise<BookDocument> {
    console.log(`Find One. Book ID: ${id}`);

    const book = await this.bookModel.findById(id).exec();

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    console.log(`Found "${book.title}"`);

    return book;
  }

  async update(
    id: string,
    updateBookDto: UpdateBookDto,
  ): Promise<BookDocument> {
    console.log(`Update One. Book ID: ${id}`);

    const book = await this.bookModel
      .findByIdAndUpdate(id, updateBookDto, { new: true })
      .exec();

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  async remove(id: string): Promise<BookDocument> {
    console.log(`Delete One. Book ID: ${id}`);

    const book = await this.bookModel.findByIdAndDelete(id);

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  async loanedBooks(): Promise<BookDocument[]> {
    console.log(`Find all loaned Books`);

    const loanedBooks = await this.bookModel
      // Cerca i campo loaned_to not equal a [] (array vuoto)
      .find({ loaned_to: { $ne: [] } })

      // Popola il campo loaned_to con il campo name trovato nel documento a cui fa riferimento l'id (loaned_to è un type: Types.ObjectId, ref: User.name).
      // .populate('loaned_to', 'name')
      .populate({
        path: 'loaned_to',
        select: 'name',
        model: 'User',
      })
      .exec();

    return loanedBooks;
  }

  async availableBooks(): Promise<BookDocument[]> {
    return this.bookModel.find({ loaned_to: { $size: 0 } }).exec();
  }
}
