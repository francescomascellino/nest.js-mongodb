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
      // .populate('loaned_to', 'name')
      .populate({
        path: 'loaned_to',
        select: 'name',
        model: 'User',
      })
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

# JWT e Validation

# 1. Installazione dei pacchetti necessari
Apri il terminale e installa i pacchetti necessari:
```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcryptjs
npm install --save-dev @types/passport-jwt @types/bcryptjs
```
Creiamo le risorse API senza CRUD
```bash
nest g resource resources/auth
```
# 2. Configurazione dell'autenticazione JWT
## 2.1 Creare i DTOs
Creiamo i DTOs per l'autenticazione:

***src/resources/auth/dto/login.dto.ts:***
```ts
export class LoginDto {
  username: string;
  password: string;
}
```

## 2.2 Creare il modulo Auth

***src/resources/auth/auth.module.ts:***
```ts
import { Module, forwardRef } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UserModule } from '../user/user.module';
import { JwtStrategy } from './strategies/jwt.strategy';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';

@Module({
  imports: [
    forwardRef(() => UserModule),
    PassportModule.register({ defaultStrategy: 'jwt' }),

    // Senza ConfigService e variabili ambientali
    /* 
    JwtModule.register({
      secret: 'SECRET',
      signOptions: {
        expiresIn: '1h',
      },
    }),
     */

    // Con ConfigService
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('SECRET_KEY'),
        signOptions: { expiresIn: '60m' },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}
```
## 2.3 Creare il servizio Auth

Esportiamo UserService da ***src/resources/user/user.module.ts:***
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
    forwardRef(() => BookModule),
  ],

  controllers: [UserController],
  providers: [UserService],
  exports: [
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    UserService, // Esportiamo UserService
  ],
})
export class UserModule {}
```

Creiamo il servizio Auth

***src/resources/auth/auth.service.ts:***
```ts
import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service'; // Importiamo UserService
import { UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    username: string,
    pass: string,
  ): Promise<UserDocument | null> {
    const user = await this.userService.findByUsername(username);
    if (user && (await bcrypt.compare(pass, user.password))) {
      return user;
    }
    return null;
  }

  async login(user: any) {
    const payload = { username: user.username, sub: user._id };
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  async register(user: any) {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const newUser = await this.userService.create({
      ...user,
      password: hashedPassword,
    });
    return newUser;
  }
}
```
## 2.4 Creare la strategia JWT

***src/resources/auth/strategies/jwt.strategy.ts:***
```ts
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      // indica di estrarre il token dal campo dell'intestazione Authorization nel formato "Bearer <token>".
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // I token con una data di scadenza scaduta verranno rifiutati.
      ignoreExpiration: false,

      // La chiave segreta utilizzata per firmare e verificare i token JWT. Viene recuperata dal ConfigService
      secretOrKey: configService.get<string>('SECRET_KEY'),

      // Senza ConfigService
      // secretOrKey: 'yourSecretKey',
    });
  }

  async validate(payload: any) {
    // l metodo validate(payload: any) viene chiamato per convalidare il payload del token JWT. 
    // Questo metodo riceve il payload del token come argomento e restituisce un oggetto che rappresenta l'utente autenticato. 
    // Nel caso di questo esempio, restituisce un oggetto contenente l'ID dell'utente (userId) (payload.sub = payload.subject) e il nome utente (username) estratti dal payload del token.
    return { userId: payload.sub, username: payload.username };
  }
}
```
## 2.5 Creare il controller Auth

***src/resources/auth/auth.controller.ts:***
```ts
import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );
    if (!user) {
      throw new UnauthorizedException();
    }
    return this.authService.login(user);
  }

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }
}
```
# 3. Aggiornamento del modulo User
## 3.1 Aggiungere il campo password nel modello User

***src/resources/user/schemas/user.schema.ts:***
```ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: true, maxlength: 50, minlength: 3, type: String })
  name: string;

  @Prop({ required: true, maxlength: 50, minlength: 3, type: String })
  surname: string;

  @Prop({ required: true, maxlength: 50, minlength: 3, type: String })
  username: string;

  @Prop({ required: true, maxlength: 100, minlength: 8, type: String })
  password: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Book' }] })
  books_on_loan: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
```
## 3.2 Aggiungere un metodo per trovare l'utente per username

***src/resources/user/user.service.ts:***
```ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from './schemas/user.schema';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(@InjectModel(User.name) private userModel: Model<UserDocument>) {}

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
```
## 3.3 Creare il DTO per la creazione dell'utente e Validazione

Installiamo le dipendenze di validazione
```bash
npm install class-validator class-transformer
```

Modifichiamo il DTO per la creazione dell'Utente
***src/resources/user/dto/create-user.dto.ts:***
```ts
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  name?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  surname?: string;

  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @IsNotEmpty()
  username!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(100)
  @IsNotEmpty()
  password!: string;

  books_on_loan?: string[];

  public constructor(opts?: Partial<CreateUserDto>) {
    Object.assign(this, opts);
  }
}
```

Abilitiamo la validazione globale
***src/main.ts:***
```ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common/pipes/validation.pipe';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      // I payload sono oggetti JS. Abilitiamo la trasformazione automatica globale per tipicizzare questi oggetti in base alla loro classe DTO
      transform: true,
    }),
  );
  await app.listen(3000);
}
bootstrap();
```

# 4. Aggiungere la protezione con JWT
## 4.1 Proteggere i route con il guardiano JWT

Creiamo il file ***src/resources/auth/guards/jwt-auth.guard.ts:***
```ts
import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
```
## 4.2 Usare il guardiano JWT nei controller
Esempio di protezione del controller User:

***src/resources/user/user.controller.ts:***
```ts
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

  @UseGuards(JwtAuthGuard) // Usiamo il Guardiano
  @Get()
  findAll(): Promise<UserDocument[]> {
    return this.userService.findAll();
  }

  // Altri metodi
}
```
# 5. Aggiornamento del modulo principale
Infine, aggiorna il modulo principale per includere AuthModule e UserModule.

***src/app.module.ts:***
```ts
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookModule } from './resources/book/book.module';
import { UserModule } from './resources/user/user.module';
import { AuthModule } from './resources/auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: `mongodb://${configService.get<string>('MONGODB_USER')}:${configService.get<string>('MONGODB_PASSWORD')}@${configService.get<string>('MONGODB_HOST')}:${configService.get<string>('MONGODB_PORT')}/${configService.get<string>('MONGODB_DATABASE')}?authMechanism=SCRAM-SHA-1&authSource=admin`,
      }),
      inject: [ConfigService],
    }),

    BookModule,
    UserModule,
    AuthModule, // Importiamo AuthModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
```
# 6. Testare l'autenticazione
Per testare l'autenticazione, puoi utilizzare un client REST come Postman. Segui questi passaggi:

1. Registrare un nuovo utente:

**POST http://localhost:3000/user** (CREATE USER)

Body (JSON):
```json
{
  "username": "testuser",
  "password": "testpassword",
  "name": "Test User"
}
```
2. Ottenere un token JWT:

**POST http://localhost:3000/auth/login** (LOGIN)

Body (JSON):
```json
{
  "username": "testuser",
  "password": "testpassword"
}
```
3. Accedere a un endpoint protetto:

**GET http://localhost:3000/user** (GET All Users)

Header:
```makefile
Authorization: Bearer <your-jwt-token>
```

# Extra

## Soft Delete

Metodo per eliminare temporeaneamente

***src/resources/book/book.service.ts***
```ts
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
```

***src/resources/book/book.controller.ts***
```ts
@UseGuards(JwtAuthGuard)
@Patch('delete/:id')
softDelete(@Param('id') id: string): Promise<BookDocument> {
  return this.bookService.softDelete(id);
}
```

## Restore

Per ripristinare elementi cancellati temporaneamente

***src/resources/book/book.service.ts***
```ts
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
```

***src/resources/book/book.controller.ts***
```ts
@UseGuards(JwtAuthGuard)
@Patch('restore/:id')
restore(@Param('id') id: string): Promise<BookDocument> {
  return this.bookService.restore(id);
}
```

## Ottenere gli elementi nel cestino (Soft Deleted)

***src/resources/book/book.service.ts***
```ts
async getSoftDeleted(): Promise<BookDocument[]> {
  console.log('Find all Soft Deleted Books');

  const books = await this.bookModel
    .find({ is_deleted: true }) // Recupera solo gli elementi is_deleted
    .populate({
      path: 'loaned_to',
      select: 'name',
      model: 'User',
    })
    .exec();

  return books;
}
```

***src/resources/book/book.controller.ts***
```ts
// POSIZIONARE PRIMA DI GET BY ID
@UseGuards(JwtAuthGuard)
@Get('delete')
async getSoftDeleted(): Promise<BookDocument[]> {
  return this.bookService.getSoftDeleted();
}

@UseGuards(JwtAuthGuard)
@Get(':id')
findOne(@Param('id') id: string): Promise<BookDocument> {
  return this.bookService.findOne(id);
}
```
## Evitare che vengano mostrati elementi Softt Deleted

***src/resources/book/book.service.ts***
```ts
import { Model } from 'mongoose';
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

@Injectable()
export class BookService {
  constructor(
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,

  ) {}

  async findAll(): Promise<BookDocument[]> {
    console.log('Find all Books');

    const books = await this.bookModel
      .find({
        // Recupera solo i documenti in cui is_deleted ancora non esiste o è 'false'
        $or: [{ is_deleted: { $exists: false } }, { is_deleted: false }],
      })
      .populate({
        path: 'loaned_to',
        select: 'name',
        model: 'User',
      })
      .exec();

    return books;
  }

  async findOne(id: string): Promise<BookDocument> {
    console.log(`Find One. Book ID: ${id}`);

    const book = await this.bookModel
      .findById(id)
      // Recupera solo i documenti in cui is_deleted ancora non esiste o è 'false'
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

  async availableBooks(): Promise<BookDocument[]> {
    return this.bookModel
      .find({
        // Recupera solo i documenti in cui is_deleted ancora non esiste o è 'false'
        $or: [{ loaned_to: null }, { loaned_to: { $size: 0 } }],
      })
      .exec();
  }
}
```

## Eliminare più documenti contemporaneamente

***src/resources/book/dto/delete-multiple-books.dto.ts***
```ts
import { IsArray, IsString } from 'class-validator';

export class DeleteMultipleBooksDto {
  @IsArray()
  @IsString({ each: true })
  bookIds: string[];
}
```

***src/resources/book/book.service.ts***
```ts
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

      // oppure:
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
```
***src/resources/book/book.controller.ts***
```ts
/**
 * Rimuove più libri dal database.
 * Questo metodo è protetto da autenticazione JWT.
 *
 * @param deleteMultipleBooksDto Un DTO che contiene un array di ID di libri da eliminare.
 * @returns Una promessa che risolve un oggetto contenente due array:
 *          - `deletedBooks`: libri eliminati con successo
 *          - `errors`: errori riscontrati durante l'eliminazione dei libri
 */
@UseGuards(JwtAuthGuard)
@Delete('bulk/delete')
removeMultiple(
  @Body() deleteMultipleBooksDto: DeleteMultipleBooksDto,
): Promise<{ deletedBooks: BookDocument[]; errors: any[] }> {
  return this.bookService.removeMultipleBooks(deleteMultipleBooksDto.bookIds);
}
```

Esempio body della request:
```json
{
    "bookIds": ["66605047a9a8d2847d5b85d6", "6669a48fbb5e7f44fed60cc3"]
}
```

## Creare più elementi contemporaneamente

***src/resources/book/dto/create-multiple-books.dto.ts***
```ts
import { IsArray, ArrayMinSize, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { CreateBookDto } from './create-book.dto';

export class CreateMultipleBooksDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateBookDto)
  books: CreateBookDto[];
}
```

***src/resources/book/book.service.ts***
```ts
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
        messages.push({
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
```

***src/resources/book/book.controller.ts***
```ts
@UseGuards(JwtAuthGuard)
@Post('bulk/create')
createMultiple(
  @Body() createMultipleBooksDto: CreateMultipleBooksDto,
): Promise<{ createdBooks: BookDocument[]; errors: any[] }> {
  return this.bookService.createMultipleBooks(createMultipleBooksDto.books);
}
```

Esempio body della request:
```json
{
  "books": [
    {
      "title": "Harry Potter e la Pietra Filosofale",
      "author": "J.K. Rowling",
      "ISBN": "9788877827021"
    },
    {
      "title": "Cronache del ghiaccio e del fuoco - Il Trono di Spade",
      "author": "George R.R. Martin",
      "ISBN": "9788804644124"
    },
    {
      "title": "1984",
      "author": "George Orwell",
      "ISBN": "9788817106405"
    },
    {
      "title": "Il Grande Gatsby",
      "author": "F. Scott Fitzgerald",
      "ISBN": "9788845290909"
    },
    {
      "title": "Orgoglio e Pregiudizio",
      "author": "Jane Austen",
      "ISBN": "9788807900228"
    }
  ]
}
```

## Modificare più elementi contemporaneamente

***src/resources/book/dto/update-multiple-books.dto.ts***
```ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateBookDto } from './create-book.dto';
import { Type } from 'class-transformer';
import { IsArray, ArrayMinSize, ValidateNested } from 'class-validator';

// Per aggiornare libri multipli abbiamo bisogno venga fornito anche l'ID di ogni libro
class UpdateBookWithIdDto extends PartialType(CreateBookDto) {
  id: string;
}
export class UpdateMultipleBooksDto extends PartialType(CreateBookDto) {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateBookDto)
  updates: UpdateBookWithIdDto[];
}
```

***src/resources/book/book.service.ts***
```ts
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
```

***src/resources/book/book.controller.ts***
```ts
@UseGuards(JwtAuthGuard)
@Patch('bulk/update')
updateMultiple(
  @Body() updateMultipleBooksDto: UpdateMultipleBooksDto,
): Promise<{ updatedBooks: BookDocument[]; errors: any[] }> {
  return this.bookService.updateMultipleBooks(updateMultipleBooksDto);
}
```

Esempio body della request:
```json
{
  "books": [
    {
      "title": "Harry Potter e la Pietra Filosofale",
      "author": "J.K. Rowling",
      "ISBN": "9788877827021"
    },
    {
      "title": "Cronache del ghiaccio e del fuoco - Il Trono di Spade",
      "author": "George R.R. Martin",
      "ISBN": "9788804644124"
    },
    {
      "title": "1984",
      "author": "George Orwell",
      "ISBN": "9788817106405"
    },
    {
      "title": "Il Grande Gatsby",
      "author": "F. Scott Fitzgerald",
      "ISBN": "9788845290909"
    },
    {
      "title": "Orgoglio e Pregiudizio",
      "author": "Jane Austen",
      "ISBN": "9788807900228"
    }
  ]
}
```

## Prendere in prestito un libro

***src/resources/user/user.service.ts***
```ts
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
```

***src/resources/user/user.controller.ts***
```ts
/**
 * Gestisce la richiesta per prendere in prestito un libro da parte di un utente.
 *
 * @param userId L'ID dell'utente che vuole prendere in prestito il libro.
 * @param bookId L'ID del libro che si vuole prendere in prestito.
 * @returns Il documento dell'utente aggiornato.
 */
@Post(':userId/borrow/:bookId')
async borrowBook(
  @Param('userId') userId: string,
  @Param('bookId') bookId: string,
): Promise<UserDocument> {
  return this.userService.borrowBook(userId, bookId);
}
```

## Ritornare un libro preso in prestito 
***src/resources/user/user.service.ts***
```ts
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
```

***src/resources/user/user.controller.ts***
```ts
/**
 * Gestisce la richiesta per restituire un libro preso in prestito da parte di un utente.
 *
 * @param userId L'ID dell'utente che vuole restituire il libro.
 * @param bookId L'ID del libro che si vuole restituire.
 * @returns Il documento dell'utente aggiornato.
 */
@Post(':userId/return/:bookId')
async returnBook(
  @Param('userId') userId: string,
  @Param('bookId') bookId: string,
): Promise<UserDocument> {
  return this.userService.returnBook(userId, bookId);
}
```

## Paginazione

Installare il plugin di paginazione
```bash
npm install mongoose-paginate-v2
```

Modificare lo Schema
```ts
import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

// Importiamo il plugin di paginazione
import * as mongoosePaginate from 'mongoose-paginate-v2';

export type BookDocument = HydratedDocument<Book>;

@Schema()
export class Book {
  @Prop({ required: true, minlength: 2, type: String })
  public title!: string;

  @Prop({ required: true, maxlength: 50, minlength: 3, type: String })
  public author!: string;

  @Prop({ required: true, maxlength: 13, minlength: 13, type: String })
  public ISBN!: string;

  @Prop({ default: false })
  public is_deleted: boolean;

  @Prop({ type: Types.ObjectId, ref: 'User' })
  loaned_to: Types.ObjectId | null;
}

export const BookSchema = SchemaFactory.createForClass(Book);

// Applichiamo il plugin allo schema
BookSchema.plugin(mongoosePaginate);
```

Modifichiamoil servizio
```ts
import {
  // Importiamo i moduli di paginazione
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

@Injectable()
export class BookService {
  constructor(
    // Modifichiamo l'iniezione del modello
    @InjectModel(Book.name) private bookModel: PaginateModel<BookDocument>,
  ) {}

  async findAll(
    page: number = 1,
    pageSize: number = 10,
  ): Promise<PaginateResult<BookDocument>> {
    console.log(`Find all Books - Page: ${page}, PageSize: ${pageSize}`);

    const options = {
      page: page,
      limit: pageSize,
      populate: {
        path: 'loaned_to',
        select: 'name',
        model: 'User',
      },
      query: {
        $or: [{ is_deleted: { $exists: false } }, { is_deleted: false }],
      },
    };

    const books = await this.bookModel.paginate({}, options);

    return books;
  }
}
```

Modifichiamo il controller
```ts
import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query, // Importiamo il decoratore Query
} from '@nestjs/common';
import { BookService } from './book.service';
import { CreateBookDto } from './dto/create-book.dto';
import { CreateMultipleBooksDto } from './dto/create-multiple-books.dto';
import { DeleteMultipleBooksDto } from './dto/delete-multiple-books.dto';
import { UpdateBookDto } from './dto/update-book.dto';
import { UpdateMultipleBooksDto } from './dto/update-multiple-books.dto';
import { BookDocument } from './schemas/book.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PaginateResult } from 'mongoose'; // Importiamo il modulo di paginazione

@Controller('book')
export class BookController {
  constructor(private readonly bookService: BookService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  async findAll(
    @Query('page') page: number,
    @Query('pageSize') pageSize: number,
  ): Promise<PaginateResult<BookDocument>> {
    const pageNumber = page ? Number(page) : 1;
    const pageSizeNumber = pageSize ? Number(pageSize) : 10;
    return this.bookService.findAll(pageNumber, pageSizeNumber);
  }
}
```