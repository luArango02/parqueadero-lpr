import { describe, expect, it } from 'vitest'
import {
  agruparPorZona,
  aplicarIngreso,
  aplicarSalida,
  ESTADOS_VISUALES,
  type Espacio,
} from '../src/mapa/espacios'

function espacio(codigo: string, sobre: Partial<Espacio> = {}): Espacio {
  return {
    id: `id-${codigo}`,
    codigo,
    zona: codigo[0],
    tipoCompatible: codigo[0] === 'M' ? 'MOTO' : 'CARRO',
    estado: 'DISPONIBLE',
    placa: null,
    ...sobre,
  }
}

describe('agruparPorZona', () => {
  it('agrupa por zona, ordenado, con el tipo de cada una', () => {
    const zonas = agruparPorZona([espacio('M-01'), espacio('A-02'), espacio('A-01')])

    expect(zonas.map((z) => z.zona)).toEqual(['A', 'M'])
    expect(zonas[0].espacios.map((e) => e.codigo)).toEqual(['A-01', 'A-02'])
    expect(zonas[0].tipos).toEqual(['CARRO'])
    expect(zonas[1].tipos).toEqual(['MOTO'])
  })

  it('cuenta libres, ocupados y fuera de servicio de cada zona', () => {
    const [zona] = agruparPorZona([
      espacio('A-01'),
      espacio('A-02', { estado: 'OCUPADO', placa: 'ABC123' }),
      espacio('A-03', { estado: 'FUERA_DE_SERVICIO' }),
    ])

    expect([zona.libres, zona.ocupados, zona.fueraDeServicio]).toEqual([1, 1, 1])
  })

  it('devuelve una lista vacía si no hay espacios', () => {
    expect(agruparPorZona([])).toEqual([])
  })
})

describe('aplicarIngreso', () => {
  it('pasa el espacio a ocupado y le pone la placa', () => {
    const resultado = aplicarIngreso([espacio('A-01'), espacio('A-02')], {
      espacio: 'A-01',
      placa: 'ABC123',
    })

    expect(resultado[0]).toMatchObject({ estado: 'OCUPADO', placa: 'ABC123' })
    expect(resultado[1]).toMatchObject({ estado: 'DISPONIBLE', placa: null })
  })

  it('no modifica la lista original', () => {
    const original = [espacio('A-01')]
    aplicarIngreso(original, { espacio: 'A-01', placa: 'ABC123' })

    expect(original[0].estado).toBe('DISPONIBLE')
  })

  it('no cambia nada si el evento no trae espacio', () => {
    const original = [espacio('A-01')]

    expect(aplicarIngreso(original, { espacio: null, placa: 'ABC123' })).toEqual(original)
  })
})

describe('aplicarSalida', () => {
  it('pasa el espacio a libre y le quita la placa', () => {
    const resultado = aplicarSalida(
      [espacio('A-01', { estado: 'OCUPADO', placa: 'ABC123' }), espacio('A-02')],
      { espacioLiberado: 'A-01' },
    )

    expect(resultado[0]).toMatchObject({ estado: 'DISPONIBLE', placa: null })
  })

  it('no cambia nada si el evento no trae espacio', () => {
    const original = [espacio('A-01', { estado: 'OCUPADO', placa: 'ABC123' })]

    expect(aplicarSalida(original, { espacioLiberado: null })).toEqual(original)
  })
})

describe('ESTADOS_VISUALES', () => {
  it('cada estado tiene etiqueta de texto y clase de color distintas', () => {
    const visuales = Object.values(ESTADOS_VISUALES)

    expect(new Set(visuales.map((v) => v.etiqueta)).size).toBe(3)
    expect(new Set(visuales.map((v) => v.clase)).size).toBe(3)
    expect(ESTADOS_VISUALES.DISPONIBLE.etiqueta).toBe('LIBRE')
  })
})