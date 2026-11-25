import { CallHandler, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { firstValueFrom, of, throwError } from 'rxjs';
import {
  CambioAuditado,
  RegistroAuditoria,
} from '../../../application/auditoria/registro-auditoria';
import { AuditoriaInterceptor } from './auditoria.interceptor';

class RegistroFalso implements RegistroAuditoria {
  cambios: CambioAuditado[] = [];
  registrar(cambio: CambioAuditado): Promise<void> {
    this.cambios.push(cambio);
    return Promise.resolve();
  }
}

const contextoCon = (peticion: object): ExecutionContext =>
  ({
    getHandler: () => () => undefined,
    switchToHttp: () => ({ getRequest: () => peticion }),
  }) as unknown as ExecutionContext;

const handler = (respuesta: unknown): CallHandler => ({
  handle: () => of(respuesta),
});

describe('AuditoriaInterceptor', () => {
  let registro: RegistroFalso;
  let reflector: Reflector;
  let interceptor: AuditoriaInterceptor;
  const admin = { sub: 'admin-1', email: 'a@p.local', rol: 'ADMINISTRADOR' };

  beforeEach(() => {
    registro = new RegistroFalso();
    reflector = new Reflector();
    jest
      .spyOn(reflector, 'get')
      .mockReturnValue({ accion: 'MODIFICAR_ESPACIO', entidad: 'Espacio' });
    interceptor = new AuditoriaInterceptor(reflector, registro);
  });

  it('registra quién hizo el cambio, sobre qué y con qué datos', async () => {
    const peticion = {
      usuario: admin,
      params: {},
      body: { estado: 'FUERA_DE_SERVICIO' },
    };

    const respuesta = await firstValueFrom(
      interceptor.intercept(contextoCon(peticion), handler({ id: 'esp-1' })),
    );

    expect(respuesta).toEqual({ id: 'esp-1' });
    expect(registro.cambios).toEqual([
      {
        usuarioId: 'admin-1',
        accion: 'MODIFICAR_ESPACIO',
        entidad: 'Espacio',
        entidadId: 'esp-1',
        datosNuevos: { estado: 'FUERA_DE_SERVICIO' },
      },
    ]);
  });

  it('en una versión de tarifas usa el id de la tarifa diurna', async () => {
    await firstValueFrom(
      interceptor.intercept(
        contextoCon({ usuario: admin, params: {}, body: {} }),
        handler({ diurna: { id: 't-diurna' }, nocturna: { id: 't-noct' } }),
      ),
    );

    expect(registro.cambios[0].entidadId).toBe('t-diurna');
  });

  it('si la operación falla no queda auditoría', async () => {
    const fallo: CallHandler = {
      handle: () => throwError(() => new Error('regla de negocio')),
    };

    await expect(
      firstValueFrom(
        interceptor.intercept(
          contextoCon({ usuario: admin, params: {}, body: {} }),
          fallo,
        ),
      ),
    ).rejects.toThrow('regla de negocio');
    expect(registro.cambios).toHaveLength(0);
  });

  it('si falla la auditoría la respuesta igual llega', async () => {
    registro.registrar = () => Promise.reject(new Error('sin base de datos'));

    const respuesta = await firstValueFrom(
      interceptor.intercept(
        contextoCon({ usuario: admin, params: {}, body: {} }),
        handler({ id: 'esp-1' }),
      ),
    );

    expect(respuesta).toEqual({ id: 'esp-1' });
  });
});
