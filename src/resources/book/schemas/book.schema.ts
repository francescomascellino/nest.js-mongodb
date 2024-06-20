// With Mongoose, everything is derived from a Schema. Each schema maps to a MongoDB collection and defines the shape of the documents within that collection. Schemas are used to define Models. Models are responsible for creating and reading documents from the underlying MongoDB database.

import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
// import { User } from 'src/resources/user/schemas/user.schema';

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

  // User.name è una proprietà del modello User che contiene il nome del modello.
  // ref: User.name dice a Mongoose che il campo a cui è applicato fa riferimento al modello User
  // @Prop({ type: Types.ObjectId, ref: User.name })

  // Usiamo la stringa 'User' per fare riferimento al modello
  @Prop({ type: Types.ObjectId, ref: 'User' })
  loaned_to: Types.ObjectId | null;
}

export const BookSchema = SchemaFactory.createForClass(Book);

// Applichiamo il plugin allo schema
BookSchema.plugin(mongoosePaginate);

/* 
TO ADD RELATION WITH USER:

In case you want to specify relation to another model, later for populating, you can use @Prop() decorator as well. For example, if Cat has Owner which is stored in a different collection called owners, the property should have type and ref. For example:


import * as mongoose from 'mongoose';
import { User } from 'resources/user/schemas/user.schema';

// inside the class definition
@Prop({ type: mongoose.Schema.Types.ObjectId, ref: 'Owner' })
owner: Owner;
 */
