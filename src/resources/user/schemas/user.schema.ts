import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema()
export class User {
  @Prop({ required: true, maxlength: 50, minlength: 3, type: String })
  name: string;

  // books_on_loan è un array di tipo Types.ObjectId di Books
  @Prop({ type: [{ type: Types.ObjectId, ref: 'Book' }], default: [] })
  books_on_loan: Types.ObjectId[];
}

export const UserSchema = SchemaFactory.createForClass(User);
