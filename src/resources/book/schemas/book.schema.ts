// With Mongoose, everything is derived from a Schema. Each schema maps to a MongoDB collection and defines the shape of the documents within that collection. Schemas are used to define Models. Models are responsible for creating and reading documents from the underlying MongoDB database.

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

/* 
TO ADD RELATION WITH USER:

In case you want to specify relation to another model, later for populating, you can use @Prop() decorator as well. For example, if Cat has Owner which is stored in a different collection called owners, the property should have type and ref. For example:


import * as mongoose from 'mongoose';
import { User } from 'resources/user/schemas/user.schema';

// inside the class definition
@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' })
owner: Owner;
 */
