import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { AuthService } from '../auth.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    super({
      // Indica di estrarre il token dal campo dell'intestazione Authorization nel formato "Bearer <token>".
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),

      // I token con una data di scadenza scaduta verranno rifiutati.
      ignoreExpiration: false,

      // La chiave segreta utilizzata per firmare e verificare i token JWT. Viene recuperata dal ConfigService
      secretOrKey: configService.get<string>('SECRET_KEY'),
    });
  }

  async validate(payload: any) {
    // l metodo validate(payload: any) viene chiamato per convalidare il payload del token JWT.
    // Questo metodo riceve il payload del token come argomento e restituisce un oggetto che rappresenta l'utente autenticato.
    // Nel caso di questo esempio, restituisce un oggetto contenente l'ID dell'utente (userId) (payload.sub = payload.subject) e il nome utente (username) estratti dal payload del token.
    return { userId: payload.sub, username: payload.username };
  }
}
