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
    // Usa forwardref per evitare dipendenze cicliche
    forwardRef(() => BookModule),
  ],

  controllers: [UserController],
  providers: [UserService],
  exports: [
    // Esporta il MoongoseModule di User per renderlo disponibile
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    UserService,
  ],
})
export class UserModule {}
