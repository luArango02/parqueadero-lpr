import { describe, expect, it } from 'vitest'
import {
  pideTipoVehiculo,
  referenciaPagoEfectivo,
  requiereValidacionManual,
  totalPendiente,
} from '../src/carril/lectura'

describe('validación manual en el carril', () => {
  it('la baja confianza y la placa no reconocida piden validación manual', () => {
    expect(requiereValidacionManual('BAJA CONFIANZA: REQUIERE VALIDACIÓN MANUAL')).toBe(true)
    expect(requiereValidacionManual('PLACA NO RECONOCIDA: REQUIERE VALIDACIÓN MANUAL')).toBe(true)
    expect(requiereValidacionManual('LA PLACA YA FIGURA ADENTRO (ANTI-PASSBACK)')).toBe(false)
  })

  it('solo la placa no reconocida pide además el tipo de vehículo', () => {
    expect(pideTipoVehiculo('PLACA NO RECONOCIDA: REQUIERE VALIDACIÓN MANUAL')).toBe(true)
    expect(pideTipoVehiculo('BAJA CONFIANZA: REQUIERE VALIDACIÓN MANUAL')).toBe(false)
  })
})

describe('pago en el carril de salida', () => {
  it('la referencia es la misma para el mismo cobro, así un doble clic no paga dos veces', () => {
    expect(referenciaPagoEfectivo('abc')).toBe(referenciaPagoEfectivo('abc'))
    expect(referenciaPagoEfectivo('abc')).not.toBe(referenciaPagoEfectivo('xyz'))
  })

  it('suma todos los cobros pendientes, también los de días anteriores', () => {
    expect(totalPendiente([{ valor: 5000 }, { valor: 8000 }])).toBe(13000)
    expect(totalPendiente([])).toBe(0)
  })
})
