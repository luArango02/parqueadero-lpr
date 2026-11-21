import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  EmisorToken,
  SesionUsuario,
} from '../../application/auth/emisor-token';

@Injectable()
export class JwtEmisorToken implements EmisorToken {
  constructor(private readonly jwt: JwtService) {}

  emitir(sesion: SesionUsuario): Promise<string> {
    return this.jwt.signAsync({ ...sesion });
  }
}
