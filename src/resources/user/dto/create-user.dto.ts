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
