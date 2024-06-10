import { Model } from 'mongoose';
import {
  ConflictException,
  Injectable,
  NotFoundException,
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

    // Inietta il modello Book che abbiamo reso disponibile in UserModule e importato in BookModule
    // @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  async borrowBook(userId: string, bookId: string): Promise<UserDocument> {
    const userObjectId = new Types.ObjectId(userId);
    const bookObjectId = new Types.ObjectId(bookId);

    const user = await this.userModel.findById(userObjectId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const book = await this.bookModel.findById(bookObjectId).exec();
    if (!book) {
      throw new NotFoundException(`Book with ID ${bookId} not found`);
    }

    if (book.loaned_to) {
      throw new ConflictException(`Book with ID ${bookId} is already on loan`);
    }

    if (
      user.books_on_loan.some((id) =>
        new Types.ObjectId(id).equals(bookObjectId),
      )
    ) {
      throw new ConflictException(
        `User already borrowed the book with ID ${bookId}`,
      );
    }

    book.loaned_to = user._id;
    user.books_on_loan.push(bookObjectId);

    await book.save();
    return await user.save();
  }

  async returnBook(userId: string, bookId: string): Promise<UserDocument> {
    const userObjectId = new Types.ObjectId(userId);
    const bookObjectId = new Types.ObjectId(bookId);

    const user = await this.userModel.findById(userObjectId).exec();
    if (!user) {
      throw new NotFoundException(`User with ID ${userId} not found`);
    }

    const book = await this.bookModel.findById(bookObjectId).exec();
    if (!book) {
      throw new NotFoundException(`Book with ID ${bookId} not found`);
    }

    if (
      !user.books_on_loan.some((id) =>
        new Types.ObjectId(id).equals(bookObjectId),
      )
    ) {
      throw new ConflictException(
        `User did not borrow the book with ID ${bookId}`,
      );
    }

    if (
      !book.loaned_to ||
      !new Types.ObjectId(book.loaned_to).equals(userObjectId)
    ) {
      throw new ConflictException(
        `Book with ID ${bookId} is not loaned to user with ID ${userId}`,
      );
    }

    user.books_on_loan = user.books_on_loan.filter(
      (id) => !new Types.ObjectId(id).equals(bookObjectId),
    );
    book.loaned_to = null;

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

  async findAll(): Promise<UserDocument[]> {
    console.log('Find all Users');

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

  async findByUsername(username: string): Promise<UserDocument | null> {
    console.log(`Find by Username. Username: ${username}`);
    return this.userModel.findOne({ username }).exec();
  }

  async update(
    id: string,
    updateUserDto: UpdateUserDto,
  ): Promise<UserDocument> {
    console.log(`Update One. User ID:${id}`);

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
