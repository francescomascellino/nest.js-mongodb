import { Model } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';
import { Book, BookDocument } from '../book/schemas/book.schema';

@Injectable()
export class UserService {
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}

  /*   create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  } */

  async findAll(): Promise<UserDocument[]> {
    console.log('Find all Users');

    const books = await this.bookModel.find().exec();

    console.log(books);

    const users = await this.userModel
      .find()
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

    const user = await this.userModel.findById(id).exec();

    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    console.log(`Found "${user.name}"`);

    return user;
  }

  /*   update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  } */

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
