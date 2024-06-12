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
import { UpdateMultipleBooksDto } from './dto/update-multiple-books.dto';
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
  private async checkISBN(ISBN: string): Promise<boolean> {
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
      .find({
        $or: [{ is_deleted: { $exists: false } }, { is_deleted: false }],
      })
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

  /**
   * Aggiorna più libri con dati specifici per ciascun libro.
   *
   * @param updateDtos Un array di oggetti che contiene l'ID del libro e i dati da aggiornare.
   * @returns Un array di documenti dei libri aggiornati.
   * @throws NotFoundException Se un libro non viene trovato.
   */
  async updateMultipleBooks(
    updateDtos: UpdateMultipleBooksDto,
  ): Promise<BookDocument[]> {
    console.log(`Update Multiple Books`);

    const updatedBooks = [];

    // Itera su ogni oggetto nell'array updates
    /* 
    Riassunto decontruction + spread
    updateDtos.updates è un array di oggetti:
    {
      "id": "6668479e1e78c11602d5032c",
      "title": "Harry Potter e la Pietra Filosofale",
      "author": "J.K. Rowling",
      "ISBN": "9788877827021"
    }
    for (const { id, ...updateData } of updateDtos.updates) significa che per ogni oggetto nell'array updateDtos.updates viene estratta la proprietà id e assegnata alla variabile id.
    Tutte le altre proprietà dell'oggetto (come title, author, ISBN, ecc.) vengono "espanse" in un nuovo oggetto e assegnate alla variabile updateData.
    Durante l'iterazione dell'esempio succede:
    { id, ...updateData }
    id diventa "6668479e1e78c11602d5032c"
    updateData diventa:
    {
      "title": "Harry Potter e la Pietra Filosofale",
      "author": "J.K. Rowling",
      "ISBN": "9788877827021"
    }
    */
    for (const { id, ...updateData } of updateDtos.updates) {
      console.log(`Updating book with ID: ${id}`, updateData);

      // Trova e aggiorna il libro nel database
      const updatedBook = await this.bookModel
        .findByIdAndUpdate(id, updateData, { new: true })
        .exec();

      // Se il libro non viene trovato, invia un'eccezione
      if (!updatedBook) {
        throw new NotFoundException(`Book with ID ${id} not found`);
      }

      // Aggiunge il libro aggiornato all'array updatedBooks
      updatedBooks.push(updatedBook);
    }

    // Restituisce l'array di libri aggiornati
    console.log(`Updated Books:`, updatedBooks);

    return updatedBooks;
  }

  async remove(id: string): Promise<BookDocument> {
    console.log(`Delete One. Book ID: ${id}`);

    const book = await this.bookModel.findByIdAndDelete(id);

    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    return book;
  }

  async removeMultipleBooks(bookIds: string[]): Promise<BookDocument[]> {
    console.log(`Delete Multiple Books`);

    const deletedBooks = [];

    for (const bookId of bookIds) {
      // const book = await this.bookModel.findByIdAndDelete(bookId);

      const book = await this.bookModel.findByIdAndDelete(bookId);

      if (!book) {
        throw new NotFoundException(`Book with ID ${bookId} not found`);
      }

      deletedBooks.push(book);
    }

    console.log('Deleted Books:', deletedBooks);

    return deletedBooks;
  }

  async softDelete(id: string): Promise<BookDocument> {
    console.log(`Soft delete. Book ID: ${id}`);
    const book = await this.bookModel.findByIdAndUpdate(
      id,
      { is_deleted: true },
      { new: true },
    );
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    return book;
  }

  async restore(id: string): Promise<BookDocument> {
    console.log(`Restore. Book ID: ${id}`);
    const book = await this.bookModel.findByIdAndUpdate(
      id,
      { is_deleted: false },
      { new: true },
    );
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }
    return book;
  }

  async getSoftDeleted(): Promise<BookDocument[]> {
    console.log('Find all Soft Deleted Books');

    const books = await this.bookModel
      .find({ is_deleted: true })
      .populate({
        path: 'loaned_to',
        select: 'name',
        model: 'User',
      })
      .exec();

    return books;
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
