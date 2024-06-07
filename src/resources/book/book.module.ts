import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { Book, BookSchema } from './schemas/book.schema';
import { UserModule } from '../user/user.module';

@Module({
  // Importa il modulo MongooseModule e definisce uno schema per l'entità Book, utilizzando il nome e lo schema forniti.
  imports: [
    MongooseModule.forFeature([{ name: Book.name, schema: BookSchema }]),
    // Importa il modulo di user per averlo a disposizione
    UserModule,
  ],

  controllers: [BookController],
  providers: [BookService],
  //   exports: [BookService]
})
export class BookModule {}
