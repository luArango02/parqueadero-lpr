import { SetMetadata, UseInterceptors, applyDecorators } from '@nestjs/common';
import { ACCION_AUDITADA, AuditoriaInterceptor } from './auditoria.interceptor';

/**
 * Deja en la tabla auditoria quién hizo el cambio y con qué datos.
 * Va junto con @Autenticado(), que es el que identifica al usuario.
 * Ejemplo: @Auditar('CREAR_VERSION_TARIFA', 'Tarifa')
 */
export function Auditar(accion: string, entidad: string) {
  return applyDecorators(
    SetMetadata(ACCION_AUDITADA, { accion, entidad }),
    UseInterceptors(AuditoriaInterceptor),
  );
}
