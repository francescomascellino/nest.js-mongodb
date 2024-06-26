import {
  // Model,
  PaginateModel,
  PaginateResult,
} from 'mongoose';
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
    @InjectModel(Book.name) private bookModel: PaginateModel<BookDocument>,

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
  ): Promise<{ createdBooks: BookDocument[]; errors: any[] }> {
    console.log('Create multiple Books');

    const createdBooks = [];
    const errors = [];

    try {
      for (const bookDto of createBookDtos) {
        // Verifica se un libro con lo stesso ISBN esiste già nel database
        if (await this.checkISBN(bookDto.ISBN)) {
          // Genera un messaggio di avviso
          console.log(
            `Book with ISBN ${bookDto.ISBN} already exists. Skipping...`,
          );
          errors.push({
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

    return { createdBooks, errors };
  }

  async findAll(
    page: number = 1,
    pageSize: number = 10,
  ): Promise<PaginateResult<BookDocument>> {
    console.log(`Find all Books - Page: ${page}, PageSize: ${pageSize}`);

    // SEPERIAMOI FILTRI DA options PER NON ANDARE IN CONFLITTO CON PAGNINATE
    const filter = {
      $or: [{ is_deleted: { $exists: false } }, { is_deleted: false }],
    };

    const options = {
      page,
      limit: pageSize,
      populate: {
        path: 'loaned_to',
        select: 'name',
        model: 'User',
      },
    };

    const books = await this.bookModel.paginate(filter, options);

    return books;

    /*     
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
    */
  }

  async findOne(id: string): Promise<BookDocument> {
    console.log(`Find One. Book ID: ${id}`);

    const book = await this.bookModel
      .findById(id)
      .or([{ is_deleted: { $exists: false } }, { is_deleted: false }])
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

  async findOneSoftDeleted(id: string): Promise<BookDocument> {
    console.log(`Find One. Book ID: ${id}`);

    const book = await this.bookModel
      .findById(id)
      .where('is_deleted')
      .equals(true)
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
  ): Promise<{ updatedBooks: BookDocument[]; errors: any[] }> {
    console.log(`Update Multiple Books`);

    const updatedBooks = [];
    const errors = [];

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

      try {
        // Trova e aggiorna il libro nel database
        const updatedBook = await this.bookModel
          .findByIdAndUpdate(id, updateData, { new: true })
          .exec();

        // Se il libro non viene trovato, invia un'eccezione
        if (!updatedBook) {
          // throw new NotFoundException(`Book with ID ${id} not found`);
          errors.push({ id, error: `Book with ID ${id} not found` });
          continue;
        }

        // Aggiunge il libro aggiornato all'array updatedBooks
        updatedBooks.push(updatedBook);
      } catch (error) {
        errors.push({ id, error: error.message });
      }
    }

    // Restituisce l'array di libri aggiornati
    console.log(`Updated Books:`, updatedBooks);
    console.log('Errors:', errors);

    return { updatedBooks, errors };
  }

  async remove(id: string): Promise<BookDocument> {
    console.log(`Delete One. Book ID: ${id}`);

    // Trova il libro nel database
    const book = await this.bookModel.findById(id);

    // Verifica se il libro esiste
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    // Controlla se il libro è in prestito
    if (book.loaned_to) {
      throw new ConflictException(`Book with ID ${id} is currently on loan`);
    }

    return await this.bookModel.findByIdAndDelete(id);
  }

  /**
   * Rimuove più libri dal database.
   * Controlla se i libri esistono e se sono attualmente in prestito.
   *
   * @param bookIds Un array di ID di libri da eliminare.
   * @returns Una promessa che risolve un oggetto contenente due array:
   *          - `deletedBooks`: libri eliminati con successo
   *          - `errors`: errori riscontrati durante l'eliminazione dei libri
   */
  async removeMultipleBooks(
    bookIds: string[],
  ): Promise<{ deletedBooks: BookDocument[]; errors: any[] }> {
    console.log(`Delete Multiple Books`);

    const deletedBooks = [];
    const errors = [];

    for (const bookId of bookIds) {
      try {
        const book = await this.bookModel.findById(bookId);
        console.log(`Deleting book with ID: ${bookId}`);

        if (!book) {
          errors.push({ bookId, error: `Book with ID ${bookId} not found` });
          continue;
        }

        if (book.loaned_to) {
          errors.push({
            bookId,
            error: `Book with ID ${bookId} is currently on loan`,
          });
          continue;
        }

        // Elimina fisicamente il libro dal database
        // await this.bookModel.findByIdAndDelete(bookId);

        // Soft delete del libro
        book.is_deleted = true;

        deletedBooks.push(book);
      } catch (error) {
        errors.push({ bookId, error: error.message });
      }
    }

    console.log('Deleted Books:', deletedBooks);
    console.log('Errors:', errors);

    return { deletedBooks, errors };
  }

  async softDelete(id: string): Promise<BookDocument> {
    // Trova il libro nel database
    const book = await this.bookModel.findById(id);

    // Verifica se il libro esiste
    if (!book) {
      throw new NotFoundException(`Book with ID ${id} not found`);
    }

    // Controlla se il libro è in prestito
    if (book.loaned_to) {
      throw new ConflictException(`Book with ID ${id} is currently on loan`);
    }

    // Soft delete del libro impostando is_deleted su true
    book.is_deleted = true;
    return await book.save();
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

  async getSoftDeleted(
    page: number = 1,
    pageSize: number = 10,
  ): Promise<PaginateResult<BookDocument>> {
    console.log(`Find all Books - Page: ${page}, PageSize: ${pageSize}`);
    console.log('Find all Soft Deleted Books');

    const options = {
      page,
      limit: pageSize,
    };

    const query = { is_deleted: true };

    const books = await this.bookModel.paginate(query, options);

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
