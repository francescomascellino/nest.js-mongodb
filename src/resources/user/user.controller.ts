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
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDocument } from './schemas/user.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(): Promise<UserDocument[]> {
    return this.userService.findAll();
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserDocument> {
    return this.userService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':username')
  findByUsername(@Param('username') id: string): Promise<UserDocument> {
    return this.userService.findByUsername(id);
  }

  @Post(':userId/borrow/:bookId')
  async borrowBook(
    @Param('userId') userId: string,
    @Param('bookId') bookId: string,
  ): Promise<UserDocument> {
    return this.userService.borrowBook(userId, bookId);
  }

  @Post(':userId/return/:bookId')
  async returnBook(
    @Param('userId') userId: string,
    @Param('bookId') bookId: string,
  ): Promise<UserDocument> {
    return this.userService.returnBook(userId, bookId);
  }
}
