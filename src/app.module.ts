import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookModule } from './resources/book/book.module';
import { UserModule } from './resources/user/user.module';

@Module({
  imports: [
    // Vecchia connessione
    /* MongooseModule.forRoot(
      'mongodb://mongouser:mongopassword@localhost:27017/test-db?authMechanism=SCRAM-SHA-1&authSource=admin'),
    */

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
