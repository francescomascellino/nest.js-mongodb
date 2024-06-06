import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { BookModule } from './resources/book/book.module';
import { UserModule } from './resources/user/user.module';

@Module({
  imports: [
    MongooseModule.forRoot(
      'mongodb://mongouser:mongopassword@localhost:27017/test-db?authMechanism=SCRAM-SHA-1&authSource=admin',
    ),
    BookModule,
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
