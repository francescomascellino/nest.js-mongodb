import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { RoleEnum } from 'src/resources/enum/role.enum';
// import { BookDocument } from 'src/resources/book/schemas/book.schema';
// import { Book } from 'src/resources/book/schemas/book.schema';

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

  // @Prop({ type: [{ type: Types.ObjectId, ref: Book.name }], default: [] })
  // books_on_loan: Types.ObjectId[];

  // Usiamo la stringa 'Book' per fare riferimento al modello
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Book' }] })
  // books_on_loan è un array di tipo Types.ObjectId di Books
  books_on_loan: Types.ObjectId[];

  @Prop({ enum: Object.values(RoleEnum), default: RoleEnum.USER })
  role: string;
}

export const UserSchema = SchemaFactory.createForClass(User);
