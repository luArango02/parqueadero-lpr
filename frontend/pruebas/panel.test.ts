import { describe, expect, it } from 'vitest'
import { EVENTOS_VISUALES, porcentajeOcupacion } from '../src/panel/ocupacion'

describe('porcentajeOcupacion', () => {
  it('calcula el porcentaje sobre los espacios en servicio', () => {
    expect(porcentajeOcupacion({ disponibles: 5, ocupados: 5 })).toBe(50)
    expect(porcentajeOcupacion({ disponibles: 2, ocupados: 1 })).toBe(33)
  })

  it('es 0 si no hay ocupados o si no hay espacios', () => {
    expect(porcentajeOcupacion({ disponibles: 10, ocupados: 0 })).toBe(0)
    expect(porcentajeOcupacion({ disponibles: 0, ocupados: 0 })).toBe(0)
  })

  it('es 100 cuando está lleno', () => {
    expect(porcentajeOcupacion({ disponibles: 0, ocupados: 10 })).toBe(100)
  })

  it('no redondea a 100 si todavía queda un espacio libre', () => {
    expect(porcentajeOcupacion({ disponibles: 1, ocupados: 299 })).toBe(99)
  })

  it('nunca es negativo ni pasa de 100, aunque los datos sean inconsistentes', () => {
    expect(porcentajeOcupacion({ disponibles: -3, ocupados: 5 })).toBe(100)
    expect(porcentajeOcupacion({ disponibles: 4, ocupados: -2 })).toBe(0)
  })
})

describe('EVENTOS_VISUALES', () => {
  it('cada tipo de evento tiene una etiqueta de texto', () => {
    expect(Object.keys(EVENTOS_VISUALES).sort()).toEqual([
      'ALERTA',
      'INGRESO',
      'INGRESO_DENEGADO',
      'PAGO',
      'SALIDA',
      'SALIDA_DENEGADA',
    ])
    expect(EVENTOS_VISUALES.INGRESO_DENEGADO.etiqueta).toBe('Ingreso denegado')
  })

  it('los intentos denegados se distinguen de los ingresos y salidas normales', () => {
    expect(EVENTOS_VISUALES.INGRESO_DENEGADO.clase).not.toBe(EVENTOS_VISUALES.INGRESO.clase)
    expect(EVENTOS_VISUALES.SALIDA_DENEGADA.clase).not.toBe(EVENTOS_VISUALES.SALIDA.clase)
  })
})