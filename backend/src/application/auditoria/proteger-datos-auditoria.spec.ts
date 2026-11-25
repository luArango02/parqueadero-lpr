import { protegerDatosAuditoria } from './proteger-datos-auditoria';

describe('protegerDatosAuditoria', () => {
  it('conserva los campos permitidos de un usuario', () => {
    expect(
      protegerDatosAuditoria('Usuario', {
        id: 'usuario-1',
        nombre: 'Administrador',
        rol: 'ADMINISTRADOR',
        activo: true,
      }),
    ).toEqual({
      id: 'usuario-1',
      nombre: 'Administrador',
      rol: 'ADMINISTRADOR',
      activo: true,
    });
  });

  it('excluye contrasenas, hashes y tokens', () => {
    expect(
      protegerDatosAuditoria('Usuario', {
        nombre: 'Operador',
        password: 'secreto',
        passwordHash: 'hash',
        accessToken: 'token',
        refreshToken: 'token',
      }),
    ).toEqual({
      nombre: 'Operador',
    });
  });

  it('permite indicar que la clave fue cambiada', () => {
    expect(
      protegerDatosAuditoria('Usuario', {
        clave: 'cambiada',
      }),
    ).toEqual({
      clave: 'cambiada',
    });
  });

  it('excluye cualquier otro valor del campo clave', () => {
    expect(
      protegerDatosAuditoria('Usuario', {
        clave: 'secreto',
      }),
    ).toEqual({});
  });

  it('conserva los valores de las tarifas', () => {
    expect(
      protegerDatosAuditoria('Tarifa', {
        sedeId: 'sede-1',
        tipoVehiculo: 'CARRO',
        valorDiurno: 8000,
        valorNocturno: 5000,
      }),
    ).toEqual({
      sedeId: 'sede-1',
      tipoVehiculo: 'CARRO',
      valorDiurno: 8000,
      valorNocturno: 5000,
    });
  });

  it('excluye referencias y datos confidenciales de pago', () => {
    expect(
      protegerDatosAuditoria('Pago', {
        cobroId: 'cobro-1',
        medio: 'EFECTIVO',
        valor: '8000.00',
        estadoCobro: 'PAGADO',
        referencia: 'referencia-privada',
        numeroTarjeta: 'dato-confidencial',
      }),
    ).toEqual({
      cobroId: 'cobro-1',
      medio: 'EFECTIVO',
      valor: '8000.00',
      estadoCobro: 'PAGADO',
    });
  });

  it('excluye objetos anidados y arreglos', () => {
    expect(
      protegerDatosAuditoria('Usuario', {
        nombre: { password: 'secreto' },
        rol: ['ADMINISTRADOR'],
        activo: true,
      }),
    ).toEqual({
      activo: true,
    });
  });

  it('conserva los valores cero, false y null', () => {
    expect(
      protegerDatosAuditoria('Tarifa', {
        valor: 0,
        activo: false,
        vigenteHasta: null,
      }),
    ).toEqual({
      valor: 0,
      activo: false,
      vigenteHasta: null,
    });
  });

  it.each([null, undefined, 'texto', 123, true, []])(
    'rechaza datos no validos: %p',
    (datos) => {
      expect(protegerDatosAuditoria('Usuario', datos)).toBeNull();
    },
  );

  it.each(['Desconocida', 'constructor', 'toString', '__proto__'])(
    'rechaza entidades no autorizadas: %s',
    (entidad) => {
      expect(
        protegerDatosAuditoria(entidad, {
          nombre: 'Prueba',
        }),
      ).toBeNull();
    },
  );
});

describe('Proteccion de auditoria de espacios', () => {
  it('conserva los datos de configuracion de un espacio', () => {
    expect(
      protegerDatosAuditoria('Espacio', {
        zona: 'A',
        numero: 11,
        tipoCompatible: 'CARRO',
        estado: 'DISPONIBLE',
        token: 'dato-confidencial',
      }),
    ).toEqual({
      zona: 'A',
      numero: 11,
      tipoCompatible: 'CARRO',
      estado: 'DISPONIBLE',
    });
  });
});
