import { Prop } from '@nestjs/mongoose';
import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  MaxLength,
  MinLength,
} from 'class-validator';
import { RoleEnum } from 'src/resources/enum/role.enum';

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
  @IsStrongPassword()
  password!: string;

  books_on_loan?: string[];

  @Prop({ enum: Object.values(RoleEnum), default: RoleEnum.USER })
  role: string;

  public constructor(opts?: Partial<CreateUserDto>) {
    Object.assign(this, opts);
  }
}
