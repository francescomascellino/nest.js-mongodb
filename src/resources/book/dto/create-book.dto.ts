export class CreateBookDto {
  public title: string;

  public author: string;

  public ISBN: string;

  public loaned_to?: string; // vogliamo che tutti i campi siano obbligatori alla creazione di un libro tranne loaned_to

  public constructor(opts: {
    title: string;
    author: string;
    ISBN: string;
    loaned_to: string;
  }) {
    this.title = opts.title;
    this.author = opts.author;
    this.ISBN = opts.ISBN;
    this.loaned_to = opts.loaned_to;
  }
}
