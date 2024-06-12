import { Model } from 'mongoose';
import {
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Book, BookDocument } from '../book/schemas/book.schema';
import { CreateUserDto } from './dto/create-user.dto';
import * as bcrypt from 'bcryptjs';
import { Types } from 'mongoose';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  /**
   * Trova un utente per ID.
   * @param userId L'ID dell'utente da trovare.
   * @returns Il documento dell'utente.
   * @throws NotFoundException Se l'utente non viene trovato.
   */
  private async findUserById(userId: string): Promise<UserDocument> {
    // Converte userId in ObjectId
    const userObjectId = new Types.ObjectId(userId);
    // Trova l'utente nel database tramite il suo ObjectId
    const user = await this.userModel.findById(userObjectId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }
    return user;
  }

  /**
   * Trova un libro per ID.
   * @param bookId L'ID del libro da trovare.
   * @returns Il documento del libro.
   * @throws NotFoundException Se il libro non viene trovato.
   */
  private async findBookById(bookId: string): Promise<BookDocument> {
    // Converte bookId in ObjectId
    const bookObjectId = new Types.ObjectId(bookId);
    // Trova il libro nel database tramite il suo ObjectId
    const book = await this.bookModel.findById(bookObjectId).exec();
    if (!book) {
      throw new NotFoundException(`Book with ID ${bookId} not found`);
    }
    return book;
  }

  /**
   * Controlla se un utente ha preso in prestito un determinato libro.
   * @param user L'utente da controllare.
   * @param bookId L'ID del libro.
   * @returns true se l'utente ha preso in prestito il libro, altrimenti false.
   */
  private userHasBorrowedBook(user: UserDocument, bookId: string): boolean {
    const bookObjectId = new Types.ObjectId(bookId);
    // Controlla se l'array books_on_loan contiene l'ObjectId del libro
    return user.books_on_loan.some((id) =>
      new Types.ObjectId(id).equals(bookObjectId),
    );
  }

  /**
   * Permette a un utente di prendere in prestito un libro.
   * Controlla se l'utente e il libro esistono, se il libro è già in prestito
   * e se l'utente ha già preso in prestito lo stesso libro.
   *
   * @param userId L'ID dell'utente che vuole prendere in prestito il libro
   * @param bookId L'ID del libro che si vuole prendere in prestito
   * @returns Il documento aggiornato dell'utente dopo aver preso in prestito il libro
   * @throws NotFoundException Se l'utente o il libro non vengono trovati
   * @throws ConflictException Se il libro è già in prestito o se l'utente ha già preso in prestito lo stesso libro
   */
  async borrowBook(userId: string, bookId: string): Promise<UserDocument> {
    // Trova l'utente e il libro nel database tramite i loro ObjectId
    const user = await this.findUserById(userId);
    const book = await this.findBookById(bookId);

    // Controlla se il libro è stato eliminato
    if (book.is_deleted) {
      throw new NotFoundException(
        `Book with ID ${bookId} has been deleted. Can not loan book from Recycle Bin`,
      );
    }

    // Controlla se il libro è già in prestito dall'utente
    if (this.userHasBorrowedBook(user, bookId)) {
      throw new ConflictException(
        `User already borrowed the book with ID ${bookId}`,
      );
    }

    // Controlla se il libro è già stato preso in prestito da un altro utente
    if (book.loaned_to) {
      throw new ConflictException(`Book with ID ${bookId} is already on loan`);
    }

    // Assegna l'utente al libro
    book.loaned_to = user._id;
    // Assegna il libro all'utente
    user.books_on_loan.push(book._id);

    // Salva le modifiche al database
    await book.save();
    return await user.save();
  }

  /**
   * Permette a un utente di restituire un libro preso in prestito.
   * Controlla se l'utente e il libro esistono, se l'utente ha preso in prestito il libro
   * e se il libro è attualmente preso in prestito dall'utente.
   *
   * @param userId L'ID dell'utente che vuole restituire il libro
   * @param bookId L'ID del libro che si vuole restituire
   * @returns Il documento aggiornato dell'utente dopo aver restituito il libro
   * @throws NotFoundException Se l'utente o il libro non vengono trovati
   * @throws ConflictException Se l'utente non ha preso in prestito il libro o se il libro non è attualmente preso in prestito dall'utente
   */
  async returnBook(userId: string, bookId: string): Promise<UserDocument> {
    // Trova l'utente e il libro nel database tramite i loro ObjectId
    const user = await this.findUserById(userId);
    const book = await this.findBookById(bookId);

    // Verifica se l'utente ha preso in prestito il libro
    if (!this.userHasBorrowedBook(user, bookId)) {
      // Lancia un'eccezione se l'utente non ha preso in prestito il libro
      throw new ConflictException(
        `User did not borrow the book with ID ${bookId}`,
      );
    }

    // Rimuove il libro dalla lista dei libri presi in prestito dall'utente
    user.books_on_loan = user.books_on_loan.filter(
      (id) => !new Types.ObjectId(id).equals(book._id),
    );
    book.loaned_to = null;

    // Salva le modifiche al database
    await book.save();
    return await user.save();
  }

  async create(createUserDto: CreateUserDto): Promise<UserDocument> {
    const salt = await bcrypt.genSalt();
    const hashedPassword = await bcrypt.hash(createUserDto.password, salt);

    const createdUser = new this.userModel({
      ...createUserDto,
      password: hashedPassword,
    });

    return createdUser.save();
  }

  async findAll(requestingUser: UserDocument): Promise<UserDocument[]> {
    console.log('Find all Users');

    console.log('Requesting User:', JSON.stringify(requestingUser));

    const users = await this.userModel
      .find()

      // Esclude il capo password
      .select('-password')

      // Popola il campo books_on_loan con il campo name trovato nel documento a cui fa riferimento l'id (books_on_loan è un type: Types.ObjectId, ref: 'Book').
      .populate({
        path: 'books_on_loan',
        select: ['title', 'ISBN'],
        model: 'Book',
      })
      .exec();

    return users;
  }

  async findOne(id: string): Promise<UserDocument> {
    console.log(`Find One. User ID: ${id}`);

    const user = await this.userModel
      .findById(id)

      // Esclude il capo password
      .select('-password')

      .populate({
        path: 'books_on_loan',
        select: ['title', 'ISBN'],
        model: 'Book',
      })
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    console.log(`Found "${user.name}"`);

    return user;
  }

  /**
   * Cerca un utente per nome utente, accessibile solo agli amministratori.
   *
   * @param requestingUser L'utente che effettua la richiesta.
   * @param username Il nome utente dell'utente da cercare.
   * @returns Il documento dell'utente trovato, se l'utente che effettua la richiesta è un amministratore; altrimenti, null.
   * @throws UnauthorizedException Se l'utente che effettua la richiesta non è un amministratore.
   */
  async adminFiindByUsername(
    requestingUser,
    username: string,
  ): Promise<UserDocument | null> {
    console.log(`Find by Username for Admin. Username: ${username}`);

    // Usa l'usser ID del requesting user per cercare l'utente nel DB
    const requester = await this.userModel
      .findById(requestingUser.userId)
      .exec();

    // Ottiene il ruolo dell'utente che sta effettuando la richiesta
    const userRole = requester.role;

    console.log('requester role:', userRole);

    // Se l'utente non è un amministratore, genera un'eccezione di autorizzazione
    if (userRole !== 'admin') {
      throw new UnauthorizedException(
        'Unauthorized: Only admins perform this operation',
      );
    }

    // Altrimenti, cerca e restituisce l'utente richiesto
    return this.userModel.findOne({ username }).exec();
  }

  /**
   * Trova un utente per nome utente.
   * Utilizzato in src/resources/auth/auth.controller.ts - async login( )
   *
   * @param username Il nome utente dell'utente da cercare.
   * @returns Il documento dell'utente trovato, se esiste; altrimenti, null.
   */
  async findByUsername(username: string): Promise<UserDocument | null> {
    console.log(`Find by Username. Username: ${username}`);
    return this.userModel.findOne({ username }).exec();
  }

  /**
   * Aggiorna un utente con i dati forniti nel DTO di aggiornamento.
   *
   * @param requestingUser Oggetto contenente l'ID e il nome utente dell'utente che sta effettuando la richiesta
   * @param id String. L'ID dell'utente da aggiornare
   * @param updateUserDto DTO con i dati per aggiornare l'utente
   * @returns Il documento aggiornato dell'utente
   */
  async update(
    requestingUser,
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    console.log(`Update One. User ID:${id}`);

    console.log('Requesting User ID:', requestingUser.userId);

    // Usa l'usser ID del requesting user per cercare l'utente nel DB
    const requester = await this.userModel
      .findById(requestingUser.userId)
      .exec();

    console.log('Requester:', requester);

    // Ricava il ruolo dell'utente che sta effettuando la richiesta
    const userRole = requester.role;

    console.log('requester:', userRole);

    // Se il ruolo dell'utente che effettua la richiesta non è Admin
    // e se nel DTO di aggiornamento è presente il valore role
    // e se il ruolo che si cerca di cambiare è diverso da quello nel database,
    // lancia un'eccezione di autorizzazione
    if (
      userRole !== 'admin' &&
      updateUserDto.role &&
      updateUserDto.role !== requester.role
    ) {
      throw new UnauthorizedException(
        'Unauthorized: Only admins can change user roles',
      );
    }

    if (updateUserDto.password) {
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(updateUserDto.password, salt);
      updateUserDto.password = hashedPassword;
    }

    const user = await this.userModel
      .findByIdAndUpdate(id, updateUserDto, { new: true })
      .exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    return user;
  }

  async remove(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }
}
