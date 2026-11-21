import { Injectable } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { Cifrador } from '../../application/auth/cifrador';

// Mismo costo que usa el seed, para que las claves de prueba y las nuevas se validen igual.
const COSTO = 10;

@Injectable()
export class BcryptCifrador implements Cifrador {
  cifrar(texto: string): Promise<string> {
    return hash(texto, COSTO);
  }

  comparar(texto: string, hashGuardado: string): Promise<boolean> {
    return compare(texto, hashGuardado);
  }
}
