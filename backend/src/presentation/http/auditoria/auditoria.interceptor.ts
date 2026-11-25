import {
  CallHandler,
  ExecutionContext,
  Inject,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable, from, mergeMap } from 'rxjs';
import { REGISTRO_AUDITORIA } from '../../../application/auditoria/registro-auditoria';
import type { RegistroAuditoria } from '../../../application/auditoria/registro-auditoria';
import type { PeticionAutenticada } from '../auth/autenticacion.guard';

export const ACCION_AUDITADA = 'accion-auditada';

export interface AccionAuditada {
  accion: string;
  entidad: string;
}

// El id afectado sale de la respuesta; una versión de tarifas devuelve { diurna, nocturna }.
function idAfectado(
  respuesta: unknown,
  peticion: PeticionAutenticada,
): string | null {
  const datos = respuesta as {
    id?: string;
    diurna?: { id?: string };
  } | null;
  const idDeRuta = peticion.params?.id;
  return (
    datos?.id ??
    datos?.diurna?.id ??
    (typeof idDeRuta === 'string' ? idDeRuta : null)
  );
}

// Se registra solo si la operación terminó bien; un error no deja rastro de un cambio que no ocurrió.
@Injectable()
export class AuditoriaInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditoriaInterceptor.name);

  constructor(
    private readonly reflector: Reflector,
    @Inject(REGISTRO_AUDITORIA) private readonly registro: RegistroAuditoria,
  ) {}

  intercept(
    contexto: ExecutionContext,
    siguiente: CallHandler,
  ): Observable<unknown> {
    const auditada = this.reflector.get<AccionAuditada | undefined>(
      ACCION_AUDITADA,
      contexto.getHandler(),
    );
    const peticion = contexto.switchToHttp().getRequest<PeticionAutenticada>();
    if (!auditada || !peticion.usuario) return siguiente.handle();

    return siguiente
      .handle()
      .pipe(
        mergeMap((respuesta: unknown) =>
          from(this.auditar(auditada, peticion, respuesta)),
        ),
      );
  }

  private async auditar(
    auditada: AccionAuditada,
    peticion: PeticionAutenticada,
    respuesta: unknown,
  ): Promise<unknown> {
    try {
      await this.registro.registrar({
        usuarioId: peticion.usuario.sub,
        accion: auditada.accion,
        entidad: auditada.entidad,
        entidadId: idAfectado(respuesta, peticion),
        datosNuevos: peticion.body,
      });
    } catch (error) {
      this.logger.warn(`No se pudo auditar: ${String(error)}`);
    }
    return respuesta;
  }
}
