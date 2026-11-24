import { ConteoPorEstado, cuposPorTipo, disponibilidadPorZona } from './cupos';

const conteo = (
  zona: string,
  tipo: ConteoPorEstado['tipo'],
  estado: ConteoPorEstado['estado'],
  cantidad: number,
): ConteoPorEstado => ({ zona, tipo, estado, cantidad });

describe('cuposPorTipo', () => {
  it('calcula total, disponibles, ocupados y fuera de servicio a partir de los espacios', () => {
    const cupos = cuposPorTipo([
      conteo('A', 'CARRO', 'DISPONIBLE', 7),
      conteo('A', 'CARRO', 'OCUPADO', 2),
      conteo('A', 'CARRO', 'FUERA_DE_SERVICIO', 1),
      conteo('M', 'MOTO', 'DISPONIBLE', 5),
    ]);

    expect(cupos).toEqual([
      {
        tipo: 'CARRO',
        total: 10,
        disponibles: 7,
        ocupados: 2,
        fueraDeServicio: 1,
        lleno: false,
      },
      {
        tipo: 'MOTO',
        total: 5,
        disponibles: 5,
        ocupados: 0,
        fueraDeServicio: 0,
        lleno: false,
      },
    ]);
  });

  it('muestra LLENO solo para el tipo sin espacios disponibles', () => {
    const cupos = cuposPorTipo([
      conteo('A', 'CARRO', 'OCUPADO', 10),
      conteo('M', 'MOTO', 'DISPONIBLE', 1),
    ]);

    expect(cupos.filter((c) => c.lleno).map((c) => c.tipo)).toEqual(['CARRO']);
  });

  it('un espacio fuera de servicio no cuenta como disponible', () => {
    const [carro] = cuposPorTipo([
      conteo('A', 'CARRO', 'FUERA_DE_SERVICIO', 2),
    ]);

    expect(carro.disponibles).toBe(0);
    expect(carro.lleno).toBe(true);
    expect(carro.total).toBe(2);
  });

  it('la disponibilidad nunca es negativa, ni con datos inconsistentes', () => {
    const [carro] = cuposPorTipo([conteo('A', 'CARRO', 'DISPONIBLE', -3)]);

    expect(carro.disponibles).toBe(0);
    expect(carro.total).toBe(0);
  });

  it('informa los dos tipos aunque no haya espacios, y quedan en LLENO', () => {
    const cupos = cuposPorTipo([]);

    expect(cupos.map((c) => c.tipo)).toEqual(['CARRO', 'MOTO']);
    expect(cupos.every((c) => c.total === 0 && c.lleno)).toBe(true);
  });
});

describe('disponibilidadPorZona', () => {
  it('agrupa por zona y la ordena', () => {
    const zonas = disponibilidadPorZona([
      conteo('M', 'MOTO', 'DISPONIBLE', 5),
      conteo('A', 'CARRO', 'DISPONIBLE', 2),
      conteo('A', 'CARRO', 'OCUPADO', 8),
    ]);

    expect(zonas.map((z) => z.zona)).toEqual(['A', 'M']);
    expect(zonas[0]).toEqual({
      zona: 'A',
      tipo: 'CARRO',
      total: 10,
      disponibles: 2,
      ocupados: 8,
      fueraDeServicio: 0,
      lleno: false,
    });
  });

  it('separa los tipos cuando una zona tiene de ambos', () => {
    const zonas = disponibilidadPorZona([
      conteo('A', 'MOTO', 'DISPONIBLE', 1),
      conteo('A', 'CARRO', 'OCUPADO', 3),
    ]);

    expect(zonas.map((z) => `${z.zona}-${z.tipo}`)).toEqual([
      'A-CARRO',
      'A-MOTO',
    ]);
    expect(zonas[0].lleno).toBe(true);
    expect(zonas[1].lleno).toBe(false);
  });
});

describe('coherencia entre zonas y tipos', () => {
  it('la suma de las zonas de un tipo coincide con el total de ese tipo', () => {
    const conteos = [
      conteo('A', 'CARRO', 'DISPONIBLE', 6),
      conteo('A', 'CARRO', 'OCUPADO', 3),
      conteo('B', 'CARRO', 'DISPONIBLE', 2),
      conteo('B', 'CARRO', 'FUERA_DE_SERVICIO', 1),
      conteo('M', 'MOTO', 'OCUPADO', 4),
    ];

    const porTipo = cuposPorTipo(conteos);
    const porZona = disponibilidadPorZona(conteos);

    for (const cupo of porTipo) {
      const zonas = porZona.filter((z) => z.tipo === cupo.tipo);
      const sumar = (campo: 'total' | 'disponibles' | 'ocupados') =>
        zonas.reduce((suma, z) => suma + z[campo], 0);
      expect(sumar('total')).toBe(cupo.total);
      expect(sumar('disponibles')).toBe(cupo.disponibles);
      expect(sumar('ocupados')).toBe(cupo.ocupados);
    }
  });

  it('en cada categoría, disponibles + ocupados + fuera de servicio = total', () => {
    const cupos = cuposPorTipo([
      conteo('A', 'CARRO', 'DISPONIBLE', 5),
      conteo('A', 'CARRO', 'OCUPADO', 4),
      conteo('A', 'CARRO', 'FUERA_DE_SERVICIO', 1),
    ]);

    for (const c of cupos) {
      expect(c.disponibles + c.ocupados + c.fueraDeServicio).toBe(c.total);
    }
  });
});
