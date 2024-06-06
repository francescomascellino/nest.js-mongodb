<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="200" alt="Nest Logo" /></a>
</p>

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Test

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Setup
```bash
$ npm i -g @nestjs/cli # se non hai ancora installato Nest
$ nest new [project-name]
```
## Creare Resources
```bash
npm g resources/book
```
Genera i files delle risorse (moduli, servizi, controller) per il modello "Book" in ***src/resources/book/***

Creare il file schema in ***src/resources/book/schemas/book.schema.ts***

## Installare le dipendenze per l'itegrazione con MongoDB
```bash
npm i @nestjs/mongoose mongoose
```

Importare MongooseModule in AppModule
***src/app.module.ts***
```ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; //Importare MongooseModule in AppModule
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookModule } from './resources/book/book.module';
import { UserModule } from './resources/user/user.module';

@Module({
  imports: [

      // Definire la stringa connessione al DB
      MongooseModule.forRoot(
      'mongodb://mongouser:mongopassword@localhost:27017/test-db?authMechanism=SCRAM-SHA-1&authSource=admin'
      ),

      BookModule,
      UserModule,
    ],
    controllers: [AppController],
    providers: [AppService],
  })
export class AppModule {}
```
## Definire lo Schema
***src/resources/book/schemas/book.schema.ts***
```ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type BookDocument = HydratedDocument<Book>;

@Schema()
export class Book {
  @Prop({ required: true, maxlength: 50, minlength: 3, type: String })
  public title!: string;

  @Prop({ required: true, maxlength: 50, minlength: 3, type: String })
  public author!: string;

  @Prop({ required: true, maxlength: 50, minlength: 3, type: String })
  public ISBN!: string;

  @Prop({ type: [String], maxlength: 50, minlength: 3 })
  public loaned_to!: string;
}

export const BookSchema = SchemaFactory.createForClass(Book);
```
***HydratedDocument<Book>*** rappresenta un documento Book di Mongoose completamente funzionale, che include sia le proprietà del modello Book che i metodi e le funzionalità di Mongoose per l'interazione con il database.
https://docs.nestjs.com/techniques/mongodb

## DTO
Un DTO è un Data Transfer Object utilizzato per trasferire dati tra servizi o risorse. 
Un DTO è un oggetto che definisce come i dati verranno inviati sulla rete.

***src/resources/book/dto/create-book.dto.ts***
Definisce la classe che verrà utilizzata quando creeremo un nuovo oggetto book da inviare come documento al db
```ts
export class CreateBookDto {
  public title: string;

  public author: string;

  public ISBN: string;

  public loaned_to?: string; // vogliamo che tutti i campi siano obbligatori alla creazione di un libro tranne loaned_to

  public constructor(opts: {
    title: string;
    author: string;
    ISBN: string;
    loaned_to: string;
  }) {
    this.title = opts.title;
    this.author = opts.author;
    this.ISBN = opts.ISBN;
    this.loaned_to = opts.loaned_to;
  }
}
```
***src/resources/book/dto/update-book.dto.ts***
Definisce la classe che verrà utilizzata quando aggiorneremo un nuovo oggetto book da inviare come documento al db 
```ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateBookDto } from './create-book.dto';

export class UpdateBookDto extends PartialType(CreateBookDto) {}
```
***PartialType(CreateBookDto)*** è una funzione di NestJS che viene utilizzata per creare un tipo parziale a partire da un DTO esistente.
Questo significa che il nuovo tipo conterrà tutti i campi del DTO originale, ma ognuno di essi sarà reso opzionale.
https://github.com/francescomascellino/nest-basics?tab=readme-ov-file#dto

## Definire i metodi del servizio:
***src/resources/book/book.service.ts***
```ts
import { Model } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book, BookDocument } from './schemas/book.schema';

@Injectable()
export class BookService {
  constructor(@InjectModel(Book.name) private bookModel: Model<Book>) {}

  async create(createBookDto: CreateBookDto) {
    console.log(`Create new Book`);

    const newBook = new this.bookModel(createBookDto);

    return await newBook.save();
  }

  // Specifichiamo che la promise che si aspettiamo è di tipo BookDocument (HydratedDocument<Book>)
  async findAll(): Promise<BookDocument[]> {
    console.log('Find all Books');

    const books = await this.bookModel.find().exec();

    return books;
  }

  async findOne(id: string): Promise<BookDocument> {
    console.log(`Find One. Book ID: ${id}`);

    const book = await this.bookModel.findById(id).exec();

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
      .find({ loaned_to: { $ne: [] } })
      .exec();

    return loanedBooks;
  }

  async availableBooks(): Promise<BookDocument[]> {
    return this.bookModel.find({ loaned_to: { $size: 0 } }).exec();
  }
}
```

## Definire le rotte nel controller
***src/resources/book/book.controller.ts***
```ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { BookDocument } from './schemas/book.schema';

@Controller('book')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @Post()

  // Ci aspettiamo un oggetto CreateBookDto nel corpo della richiesta
  create(@Body() createBookDto: CreateBookDto) {
    return this.bookService.create(createBookDto);
  }

  @Get()

  // Ci aspettiamo un array di documenti BookDocument come Promise
  async findAll(): Promise<BookDocument[]> {
    return this.bookService.findAll();
  }

  // Gli endpoint personalizzati vanno definiti prima di quelli che richiedono un id per evitare conflitti
  @Get('loaned')
  getLoanedBooks(): Promise<BookDocument[]> {
    return this.bookService.loanedBooks();
  }

  @Get('available')
  async getAvailableBooks(): Promise<BookDocument[]> {
    return this.bookService.availableBooks();
  }

  @Get(':id')

  // Restituisce una Promise che contiene un documento BookDocument corrispondente all'ID fornito.
  findOne(@Param('id') id: string): Promise<BookDocument> {
    return this.bookService.findOne(id);
  }

  // Aggiorna un documento BookDocument con l'ID fornito come parametro
  @Patch(':id')
  
  // Utilizza i dati forniti nell'oggetto UpdateBookDto nel corpo della richiesta.
  update(
    @Param('id') id: string,

    // Ci aspettiamo un oggetto UpdateBookDto nel corpo della richiesta
    @Body() updateBookDto: UpdateBookDto,
  ): Promise<BookDocument> {
    return this.bookService.update(id, updateBookDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string): Promise<BookDocument> {
    return this.bookService.remove(id);
  }
}
```

## @nestjs/config e process.env

Installare le dipendenze necessarie:
```bash
npm install @nestjs/config
npm install dotenv // Solitamente è già installato
```
Creare un file .env
```js
MONGODB_USER=[username]
MONGODB_PASSWORD=[password]
MONGODB_HOST=localhost
MONGODB_PORT=[port]
MONGODB_DATABASE=[db name]
```

Modificare AppModule

***src/app.module.ts***
```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config'; // Importare ConfigModule e ConfigService
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookModule } from './resources/book/book.module';
import { UserModule } from './resources/user/user.module';

@Module({
  imports: [

    // Inizializza il modulo di configurazione e rende globali le variabili dei file di ambiente
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
  
      // E' buona prassi importare ConfigModule anche se è globale per garantire sia disponibile nelle configurazioni asicrone
      imports: [ConfigModule],

      // useFactory è una funzione che accetta ConfigService come parametro e restituisce un oggetto di configurazione
      useFactory: async (configService: ConfigService) => ({

        // configService.get<string>('MONGODB_USER') ..ecc: utilizza ConfigService per leggere le variabili di ambiente definite nel file .env
        uri: `mongodb://${configService.get<string>('MONGODB_USER')}:${configService.get<string>('MONGODB_PASSWORD')}@${configService.get<string>('MONGODB_HOST')}:${configService.get<string>('MONGODB_PORT')}/${configService.get<string>('MONGODB_DATABASE')}?authMechanism=SCRAM-SHA-1&authSource=admin`,
      }),

      // Inietta ConfigService nella funzione useFactory
      inject: [ConfigService],
    }),

    BookModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```