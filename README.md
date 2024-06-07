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

## Importare MongooseModule
L'import dello Schema e della classe Book viene utilizzato per definire uno schema Mongoose per l'entità Book all'interno dell'applicazione.
In questo caso lo scope dell'importazione di Book sarà solo interno a BookModule.
Dobbiamo esportarlo e importarlo per renderlo disponibile altrove

***src/resources/book/book.module.ts***
```ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose'; // Importiamo MongooseModule
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { Book, BookSchema } from './schemas/book.schema'; // Importiamo lo Schema

@Module({
  // Importa il modulo MongooseModule e definisce uno schema per l'entità Book, utilizzando il nome e lo schema forniti.
  imports: [
    MongooseModule.forFeature([{ name: Book.name, schema: BookSchema }]),
  ],

  controllers: [BookController],
  providers: [BookService],

  // Se volessimo esportare MongooseModule di Book per renderlo disponibile altrove.
  // exports: [MongooseModule.forFeature([{ name: Book.name, schema: BookSchema }])],
})
export class BookModule {}
```

Importando BookModule in un altro modulo avremo disponibli le esportazioni dichiarate:
```ts
// ESEMPIO
import { Module } from '@nestjs/common';
import { BookModule } from './book.module';

@Module({
  imports: [
    BookModule, // Importa BookMule, che include il MongooseModule
    // Ecc
  ],
  // Ecc
})
export class EsempioModule {}
```

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

## Query con riferimento a campi popolati usando altri modelli

In questo caso vogliamo che quando effettuiamo la query per ottenere i libri in affitto, riceviamo nella response anche il nome dell'utente oltre al suo ID.

Come primo passaggio dobbiamo esportare il MongooseModule di User per renderlo disponibile

***src//resources/user/user.module***
```ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './schemas/user.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],

  controllers: [UserController],
  providers: [UserService],
  exports: [

    // Esporta il MoongoseModule di User per renderlo disponibile
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
})
export class UserModule {}
```
Importiamo in BookModule il nostro UserModule (che ora esporta il Modello e lo Schema di User)

***src/resources/book/book.module.ts***
```ts
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { BookService } from './book.service';
import { BookController } from './book.controller';
import { Book, BookSchema } from './schemas/book.schema';

// Importiamo UserModule
import { UserModule } from '../user/user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Book.name, schema: BookSchema }]),

    // Importa il modulo di user per averlo a disposizione
    UserModule,
  ],

  controllers: [BookController],
  providers: [BookService],
})
export class BookModule {}
```
Successivamente aggiungiamo i dovuti riferimenti nello schema di Book.

***src/resources/book/schemas/book.schema.ts***
```ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

// Importiamo il nostro modello
import { User } from 'src/resources/user/schemas/user.schema';

export type BookDocument = HydratedDocument<Book>;

@Schema()
export class Book {

  // Altre Prop

  // User.name è una proprietà del modello User che contiene il nome del modello.
  // ref: User.name dice a Mongoose che il campo a cui è applicato fa riferimento al modello User
  @Prop({ type: Types.ObjectId, ref: User.name })
  loaned_to: Types.ObjectId;
}

export const BookSchema = SchemaFactory.createForClass(Book);
```

Dopodichè nel BookService importiamo il modello di User che abbiamo a disposizione poiché è stato importato nel nostro BookModule e definiamo il metodo
```ts
import { Model } from 'mongoose';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { CreateBookDto } from './dto/create-book.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { Book, BookDocument } from './schemas/book.schema';

// Importiamo il modello di User e il suo Schema
import { User, UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class BookService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<Book>,

    // Iniettiamo il modello user che abbiamo reso disponibile in UserModule e importato in BookModule
    @InjectModel(User.name) private userModel: Model<UserDocument>,
  ) {}

  // Altre CRUD e Query

  async loanedBooks(): Promise<BookDocument[]> {
    console.log(`Find all loaned Books`);

    const loanedBooks = await this.bookModel
      // Cerca i campo loaned_to not equal a [] (array vuoto)
      .find({ loaned_to: { $ne: [] } })

      // Popola il campo loaned_to con il campo name trovato nel documento a cui fa riferimento l'id (loaned_to è un type: Types.ObjectId, ref: User.name).
      .populate('loaned_to', 'name')
      .exec();

    return loanedBooks;
  }
}
```

In questo modo la response all'endpoint ***http://localhost:[port]/book/loaned***
dovrebbe essere:
```json
[
    {
        "_id": "66605047a9a8d2847d5b85d6",
        "ISBN": "9781234567890",
        "title": "Il Signore degli Anelli",
        "author": "J.R.R. Tolkien",
        "loaned_to": {
            "_id": "66605031a9a8d2847d5b85d5",
            "name": "Mario Rossi"
        }
    }
]
```

## Evitare le dipendenze circolari

Quando due modelli si richiamano a vicenda si possono incontrare problemi di dipendenza circolare.
E' possibile evitarli riferendosi al modello usando una stringa nello schema:

***src/resources/book/schemas/user.schema.ts***
```ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: true, maxlength: 50, minlength: 3, type: String })
  name: string;

  
  // Usiamo la stringa 'Book' per fare riferimento al modello
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Book' }] })
  // books_on_loan è un array di tipo Types.ObjectId di Books
  books_on_loan: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
```

e importando il modulo usando forwardRef().

forwardRef() è una funzione fornita da NestJS che risolve il problema della dipendenza ciclica nei moduli.

Quando due moduli dipendono l'uno dall'altro, ad esempio, se il BookModule dipende dal UserModule e viceversa, ci sarà un errore di dipendenza ciclica.

Invece di importare direttamente il UserModule all'interno del BookModule, utilizzando forwardRef() importeremo UserModule in modo "ritardato", permettendo a NestJS di gestire correttamente le dipendenze cicliche.

***src//resources/user/user.module***
```ts
import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { User, UserSchema } from './schemas/user.schema';
import { BookModule } from '../book/book.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    // Importa il modulo di user per averlo a disposizione
    forwardRef(() => BookModule), // Usa forwardref
  ],

  controllers: [UserController],
  providers: [UserService],
  exports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
  ],
})
export class UserModule {}
```

Sucessivamente possiamo definire nel servizio il metodo, specificando i dettagli da popolare usando il modello importato:

***src/resources/user/user.service.ts***
```ts
async findAll(): Promise<UserDocument[]> {
    console.log('Find all Users');

    const books = await this.bookModel.find().exec();

    console.log(books);

    const users = await this.userModel
      .find()
      // Definiamo o dettagli da usare per popolare il campo
      .populate({
        path: 'books_on_loan',
        select: ['title', 'ISBN'],
        model: 'Book',
      })
      .exec();

    return users;
  }
```

PS: non abbiamo bisogno di iniettare il modello importato se non usato:

***src/resources/user/user.service.ts***
```ts
  constructor(
    @InjectModel(User.name) private userModel: Model<UserDocument>,

    // Inietta il modello Book che abbiamo reso disponibile in UserModule e importato in BookModule
    // @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) {}
```
la nostra response dovrebbe esere:
```json
[
    {
        "_id": "66605031a9a8d2847d5b85d5",
        "name": "Mario Rossi",
        "books_on_loan": [
            {
                "_id": "66605047a9a8d2847d5b85d6",
                "ISBN": "9781234567890",
                "title": "Il Signore degli Anelli"
            }
        ]
    }
]
```