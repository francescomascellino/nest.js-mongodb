import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDocument } from './schemas/user.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

export interface ExtendedRequest extends Request {
  user: UserDocument;
}
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: ExtendedRequest): Promise<UserDocument[]> {
    const requestingUser = req.user;
    return this.userService.findAll(requestingUser);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserDocument> {
    return this.userService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Req() req: ExtendedRequest,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // Recuperiamo l'utente che sta facendo la richiesta e lo inviamo al servizio
    const requestingUser = req.user;
    return this.userService.update(requestingUser, id, updateUserDto);
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
