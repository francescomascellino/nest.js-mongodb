import { Model } from 'mongoose';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book, BookDocument } from './schemas/book.schema';
// import { User, UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class BookService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,

    // Inietta il modello User che abbiamo reso disponibile in UserModule e importato in BookModule
    // @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  /**
   * Verifica se un libro con un dato ISBN esiste nel database.
   * @param ISBN - Il codice ISBN del libro da verificare.
   * @returns Una promessa che restituisce true se il libro esiste, altrimenti false.
   */
  async checkISBN(ISBN: string): Promise<boolean> {
    const existingBook = await this.bookModel.findOne({ ISBN }).exec();
    // Restituisce true se esiste un libro con lo stesso ISBN, altrimenti false
    return !!existingBook;
  }

  /**
   * Crea un nuovo libro nel database.
   * @param createBookDto - I dati del libro da creare.
   * @returns Una promessa che restituisce il documento del libro creato.
   * @throws ConflictException se un libro con lo stesso ISBN esiste già.
   */
  async create(createBookDto: CreateBookDto) {
    console.log(`Create new Book`);

    // Se checkISBN rileva che il libro esiste, genera un'eccezione
    if (await this.checkISBN(createBookDto.ISBN)) {
      console.log(`Book with ISBN ${createBookDto.ISBN} already exists.`);
      throw new ConflictException(
        `Book with ISBN ${createBookDto.ISBN} already exists.`,
      );
    }

    const newBook = new this.bookModel(createBookDto);

    return await newBook.save();
  }

  /**
   * Crea più libri nel database.
   * @param createBookDtos - Un array di dati dei libri da creare.
   * @returns Una promessa che restituisce un array di documenti dei libri creati.
   */
  async createMultipleBooks(
    createBookDtos: CreateBookDto[],
  ): Promise<BookDocument[]> {
    console.log('Create multiple Books');

    const createdBooks = [];
    const messages = [];

    try {
      for (const bookDto of createBookDtos) {
        // Verifica se un libro con lo stesso ISBN esiste già nel database
        if (await this.checkISBN(bookDto.ISBN)) {
          // Genera un messaggio di avviso
          console.log(
            `Book with ISBN ${bookDto.ISBN} already exists. Skipping...`,
          );
          messages.push({
            ISBN: `${bookDto.ISBN}`,
            message: `Book with ISBN ${bookDto.ISBN} already exists.`,
          });
          // Passa al prossimo libro
          continue;
        }

        const newBook = new this.bookModel(bookDto);
        const createdBook = await newBook.save();
        createdBooks.push(createdBook);
      }
    } catch (error) {
      console.error('Error creating books:', error);
      throw error;
    }

    // Aggiunge i messaggi alla lista dei libri creati
    createdBooks.push({ messages });

    return createdBooks;
  }

  async findAll(): Promise<BookDocument[]> {
    console.log('Find all Books');

    const books = await this.bookModel
      .find()
      .populate({
        path: 'loaned_to',
        select: 'name',
        model: 'User',
      })
      .exec();

    return books;
  }

  async findOne(id: string): Promise<BookDocument> {
    console.log(`Find One. Book ID: ${id}`);

    const book = await this.bookModel
      .findById(id)
      .populate({
        path: 'loaned_to',
        select: 'name',
        model: 'User',
      })
      .exec();

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
      .find({ loaned_to: { $ne: null } })

      // Popola il campo loaned_to con il campo name trovato nel documento a cui fa riferimento l'id (loaned_to è un type: Types.ObjectId, ref: 'User').
      .populate({
        path: 'loaned_to',
        select: 'name',
        model: 'User',
      })
      .exec();

    return loanedBooks;
  }

  async availableBooks(): Promise<BookDocument[]> {
    return this.bookModel
      .find({
        $or: [{ loaned_to: null }, { loaned_to: { $size: 0 } }],
      })
      .exec();
  }
}
