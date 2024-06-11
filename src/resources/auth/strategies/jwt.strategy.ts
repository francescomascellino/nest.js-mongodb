import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

/**
 * Strategia per la gestione dell'autenticazione JWT.
 * Questa classe estende PassportStrategy per fornire l'integrazione con il framework di autenticazione Passport di NestJS.
 */
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  /**
   * Costruttore della classe JwtStrategy.
   * @param authService Il servizio di autenticazione utilizzato per convalidare l'utente.
   * @param configService Il servizio di configurazione utilizzato per recuperare la chiave segreta per la firma e la verifica dei token JWT.
   */
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    // Richiama il costruttore della classe padre PassportStrategy
    super({
      // Indica di estrarre il token dal campo dell'intestazione Authorization nel formato "Bearer <token>".
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // I token con una data di scadenza scaduta verranno rifiutati.
      ignoreExpiration: false,

      // La chiave segreta utilizzata per firmare e verificare i token JWT. Viene recuperata dal ConfigService
      secretOrKey: configService.get<string>('SECRET_KEY'),
    });
  }

  /**
   * Metodo per convalidare il payload del token JWT.
   * @param payload Il payload del token JWT.
   * @returns Un oggetto che rappresenta l'utente autenticato, contenente l'ID dell'utente (userId) e il nome utente (username) estratti dal payload del token.
   */
  async validate(payload: any) {
    // l metodo validate(payload: any) viene chiamato per convalidare il payload del token JWT.
    // Questo metodo riceve il payload del token come argomento e restituisce un oggetto che rappresenta l'utente autenticato.
    // Nel caso di questo esempio, restituisce un oggetto contenente l'ID dell'utente (userId) (payload.sub = payload.subject) e il nome utente (username) estratti dal payload del token.
    // Il payload viene definito in sers/resources/auth/auth.service.ts - login()
    return { userId: payload.sub, username: payload.username };
  }
}
