import { Model } from 'mongoose';
import { Injectable } from '@nestjs/common';
// import { CreateUserDto } from './dto/create-user.dto';
// import { UpdateUserDto } from './dto/update-user.dto';
import { InjectModel } from '@nestjs/mongoose';
import { User, UserDocument } from './schemas/user.schema';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<User>) {}

  /*   create(createUserDto: CreateUserDto) {
    return 'This action adds a new user';
  } */

  async findAll(): Promise<UserDocument[]> {
    console.log('Find all Users');

    const users = await this.userModel.find().exec();

    return users;
  }

  findOne(id: number) {
    return `This action returns a #${id} user`;
  }

  /*   update(id: number, updateUserDto: UpdateUserDto) {
    return `This action updates a #${id} user`;
  } */

  remove(id: number) {
    return `This action removes a #${id} user`;
  }
}
