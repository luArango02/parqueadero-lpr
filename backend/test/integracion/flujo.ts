import { randomUUID } from 'node:crypto';
import type { NotificadorAccesos } from '../../src/application/accesos/notificador-accesos';
import {
  RegistrarIngresoUseCase,
  type ResultadoIngreso,
} from '../../src/application/accesos/registrar-ingreso.use-case';
import {
  RegistrarSalidaUseCase,
  type ResultadoSalida,
} from '../../src/application/accesos/registrar-salida.use-case';
import { RegistrarPagoEfectivoUseCase } from '../../src/application/pagos/registrar-pago-efectivo.use-case';
import type { Reloj } from '../../src/domain/tiempo/reloj';
import type { PrismaService } from '../../src/infrastructure/database/prisma.service';
import { PrismaIngresoRepositorio } from '../../src/infrastructure/repositories/prisma-ingreso.repositorio';
import { PrismaPagoRepository } from '../../src/infrastructure/repositories/prisma-pago.repository';
import { PrismaSalidaRepositorio } from '../../src/infrastructure/repositories/prisma-salida.repositorio';

// Las pruebas no necesitan Socket.IO: el aviso en tiempo real se reemplaza por uno vacío.
const notificadorVacio: NotificadorAccesos = {
  ingresoRegistrado: () => Promise.resolve(),
  salidaRegistrada: () => Promise.resolve(),
};

/** Reloj fijo: 10:00 hora de Bogotá del 24/11/2026, o sea franja diurna y un solo día operativo. */
class RelojFijo implements Reloj {
  ahora(): Date {
    return new Date('2026-11-24T15:00:00.000Z');
  }
}

export interface Flujo {
  ingresar(placa: string): Promise<ResultadoIngreso>;
  salir(placa: string): Promise<ResultadoSalida>;
  pagar(cobroId: string): Promise<void>;
  /** Ingresa un carro y paga de una vez el cobro del día. */
  ingresarYPagar(placa: string): Promise<ResultadoIngreso>;
}

/** Arma los casos de uso REALES (con repositorios Prisma sobre la base de pruebas), igual que en producción. */
export function crearFlujo(prisma: PrismaService, operadorId: string): Flujo {
  const reloj = new RelojFijo();
  const ingreso = new RegistrarIngresoUseCase(
    new PrismaIngresoRepositorio(prisma),
    reloj,
    notificadorVacio,
  );
  const salida = new RegistrarSalidaUseCase(
    new PrismaSalidaRepositorio(prisma),
    reloj,
    notificadorVacio,
  );
  const pago = new RegistrarPagoEfectivoUseCase(
    new PrismaPagoRepository(prisma),
  );

  const flujo: Flujo = {
    ingresar: (placa) => ingreso.ejecutar({ placa }),
    salir: (placa) => salida.ejecutar({ placa }),
    pagar: async (cobroId) => {
      await pago.ejecutar({
        cobroId,
        referencia: `EFECTIVO-${randomUUID()}`,
        registradoPorId: operadorId,
      });
    },
    ingresarYPagar: async (placa) => {
      const resultado = await flujo.ingresar(placa);
      await flujo.pagar(idDeCobro(resultado));
      return resultado;
    },
  };
  return flujo;
}

/** El id del cobro generado en un ingreso; falla con un mensaje claro si no hubo cobro. */
export function idDeCobro(resultado: ResultadoIngreso): string {
  if (!resultado.cobro) {
    throw new Error(
      `Se esperaba un cobro para ${resultado.placa}, pero el ingreso dijo: ${resultado.motivo}`,
    );
  }
  return resultado.cobro.id;
}
