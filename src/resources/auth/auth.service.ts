import { Inject, Injectable, forwardRef } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { UserService } from '../user/user.service';
import { UserDocument } from '../user/schemas/user.schema';

@Injectable()
export class AuthService {
  constructor(
    @Inject(forwardRef(() => UserService))
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  /**
   * Valida le credenziali di un utente.
   *
   * @param username Il nome utente da validare.
   * @param pass La password da validare.
   * @returns Il documento dell'utente se le credenziali sono valide, altrimenti null.
   */
  async validateUser(
    username: string,
    pass: string,
  ): Promise<UserDocument | null> {
    // Trova l'utente nel database usando il nome utente
    const user = await this.userService.findByUsername(username);

    // Se l'utente esiste e la password corrisponde, restituisce il documento dell'utente
    if (user && (await bcrypt.compare(pass, user.password))) {
      return user;
    }

    // Se l'utente non esiste o la password non corrisponde, restituisce null
    return null;
  }

  /**
   * Effettua il login per un utente.
   *
   * @param user L'oggetto utente contenente le informazioni dell'utente.
   * @returns Un oggetto contenente il token di accesso JWT.
   */
  async login(user: any) {
    // Crea il payload per il token JWT con il nome utente e l'ID dell'utente
    const payload = { username: user.username, sub: user._id };

    // Restituisce un oggetto contenente il token di accesso JWT firmato
    return {
      access_token: this.jwtService.sign(payload),
    };
  }

  // La creazione dell'utente è delegata al controller User. il metodo resta qui per referenza
  /* 
  async register(user: any) {
    const hashedPassword = bcrypt.hashSync(user.password, 10);
    const newUser = await this.userService.create({
      ...user,
      password: hashedPassword,
    });
    return newUser;
  }
   */
}
