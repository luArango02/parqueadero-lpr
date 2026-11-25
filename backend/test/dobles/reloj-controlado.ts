import type { Reloj } from '../../src/domain/tiempo/reloj';

export class RelojControlado implements Reloj {
  private instante: Date;

  constructor(instanteInicial: string | Date) {
    this.instante = this.validar(instanteInicial);
  }

  ahora(): Date {
    return new Date(this.instante.getTime());
  }

  fijar(instante: string | Date): void {
    this.instante = this.validar(instante);
  }

  avanzarMilisegundos(milisegundos: number): void {
    this.fijar(new Date(this.instante.getTime() + milisegundos));
  }

  private validar(instante: string | Date): Date {
    const fecha = new Date(instante);

    if (!Number.isFinite(fecha.getTime())) {
      throw new Error('Instante de prueba invalido');
    }

    return fecha;
  }
}
