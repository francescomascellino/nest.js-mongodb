import { Body, Controller, Post, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
// import { CreateUserDto } from '../user/dto/create-user.dto';
import { UserService } from '../user/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  /**
   * Effettua l'accesso per un utente.
   * Prima effettua una validazione usando il metodo authService.validateUser()
   * Se la validazione è positiva richiama il metodo authService.login()
   *
   * @param loginDto L'oggetto contenente le credenziali di accesso dell'utente.
   * @returns Un oggetto contenente il token di accesso JWT se l'accesso è riuscito, altrimenti genera un'eccezione di autorizzazione.
   */
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    // Controlla se le credenziali di accesso dell'utente sono valide
    const user = await this.authService.validateUser(
      loginDto.username,
      loginDto.password,
    );

    // Se le credenziali sono valide, genera il token di accesso JWT e lo restituisce
    if (!user) {
      throw new UnauthorizedException();
    }

    // Se le credenziali non sono valide, genera un'eccezione di autorizzazione
    return this.authService.login(user);
  }

  // La creazione dell'utente è delegata al controller User. il metodo resta qui per referenza
  /* 
  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }
  */
}
