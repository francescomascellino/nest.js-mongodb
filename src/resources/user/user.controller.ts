import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Req,
} from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { UserDocument } from './schemas/user.schema';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

/**
 * Interfaccia che estende l'interfaccia Request di Express per includere le informazioni dell'utente autenticato.
 * Questa interfaccia viene utilizzata per assicurare che le informazioni dell'utente siano disponibili in tutte le richieste
 * che richiedono autenticazione.
 *
 * @property user Contiene le informazioni del documento utente autenticato, includendo tutti i campi del modello UserDocument.
 */
export interface ExtendedRequest extends Request {
  user: UserDocument;
}
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Req() req: ExtendedRequest): Promise<UserDocument[]> {
    const requestingUser = req.user;
    return this.userService.findAll(requestingUser);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string): Promise<UserDocument> {
    return this.userService.findOne(id);
  }

  /**
   * Endpoint che permette di aggiornare le informazioni di un utente.
   * Utilizza il JwtAuthGuard per proteggere l'endpoint e richiede un token JWT valido.
   *
   * @param req Oggetto della richiesta che include i dettagli dell'utente che sta facendo la richiesta
   * @param id String. L'ID dell'utente da aggiornare
   * @param updateUserDto DTO che contiene le nuove informazioni da aggiornare per l'utente
   * @returns Il documento aggiornato dell'utente
   */
  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(
    @Req() req: ExtendedRequest,
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // Recuperiamo l'utente che sta facendo la richiesta e lo inviamo al servizio
    const requestingUser = req.user;
    return this.userService.update(requestingUser, id, updateUserDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }

  /**
   * Trova un utente per nome utente, accessibile solo agli amministratori.
   *
   * @param req La richiesta HTTP che contiene le informazioni sull'utente che effettua la richiesta.
   * @param username Il nome utente dell'utente da cercare.
   * @returns Il documento dell'utente trovato, se l'utente che effettua la richiesta è un amministratore; altrimenti, null.
   */
  @UseGuards(JwtAuthGuard)
  @Get('/admin/search/:username')
  findByUsername(
    @Req() req: ExtendedRequest,
    @Param('username') username: string,
  ): Promise<UserDocument | null> {
    const requestingUser = req.user;
    console.log(requestingUser);

    return this.userService.adminFiindByUsername(requestingUser, username);
  }

  /**
   * Gestisce la richiesta per prendere in prestito un libro da parte di un utente.
   *
   * @param userId L'ID dell'utente che vuole prendere in prestito il libro.
   * @param bookId L'ID del libro che si vuole prendere in prestito.
   * @returns Il documento dell'utente aggiornato.
   */
  @Post(':userId/borrow/:bookId')
  async borrowBook(
    @Param('userId') userId: string,
    @Param('bookId') bookId: string,
  ): Promise<UserDocument> {
    return this.userService.borrowBook(userId, bookId);
  }

  /**
   * Gestisce la richiesta per restituire un libro preso in prestito da parte di un utente.
   *
   * @param userId L'ID dell'utente che vuole restituire il libro.
   * @param bookId L'ID del libro che si vuole restituire.
   * @returns Il documento dell'utente aggiornato.
   */
  @Post(':userId/return/:bookId')
  async returnBook(
    @Param('userId') userId: string,
    @Param('bookId') bookId: string,
  ): Promise<UserDocument> {
    return this.userService.returnBook(userId, bookId);
  }
}
