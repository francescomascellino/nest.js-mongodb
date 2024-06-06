export class CreateUserDto {
  public name!: string;
  public books_on_loan?: string[];

  public constructor(opts?: Partial<CreateUserDto>) {
    Object.assign(this, opts);
  }
}
