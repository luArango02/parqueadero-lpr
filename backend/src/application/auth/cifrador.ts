export interface Cifrador {
  cifrar(texto: string): Promise<string>;
  comparar(texto: string, hash: string): Promise<boolean>;
}

export const CIFRADOR = Symbol('CIFRADOR');
