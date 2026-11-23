import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ConsultaOcupacion } from './consulta-ocupacion';

// Nombres de los eventos que escucha el frontend. Están documentados en el README.
export const EVENTOS = {
  barrera: 'barrera:actualizada',
  ingreso: 'acceso:ingreso',
  salida: 'acceso:salida',
  ocupacion: 'ocupacion:actualizada',
} as const;

// Usa el mismo puerto de la API (path /socket.io). Solo emite: el frontend no envía mensajes.
@WebSocketGateway({ cors: { origin: true } })
export class EventosGateway implements OnGatewayConnection {
  private readonly logger = new Logger(EventosGateway.name);

  @WebSocketServer()
  servidor!: Server;

  constructor(private readonly ocupacion: ConsultaOcupacion) {}

  // Quien se conecta recibe de una vez la ocupación actual, sin esperar al próximo movimiento.
  async handleConnection(cliente: Socket): Promise<void> {
    try {
      cliente.emit(EVENTOS.ocupacion, await this.ocupacion.resumen());
    } catch (error) {
      this.logger.warn(
        `No se pudo enviar la ocupación inicial: ${String(error)}`,
      );
    }
  }

  emitir(evento: string, datos: unknown): void {
    this.servidor.emit(evento, datos);
  }
}
