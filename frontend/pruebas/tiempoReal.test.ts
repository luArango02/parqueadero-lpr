import { describe, expect, it } from 'vitest'
import { CARRIL_SIN_LECTURAS, aplicarBarrera } from '../src/tiempoReal/barrera'
import { debeReconectarManualmente, type BarreraActualizada } from '../src/tiempoReal/eventos'

function evento(sobre: Partial<BarreraActualizada> = {}): BarreraActualizada {
  return {
    carril: 'ENTRADA',
    estado: 'ABIERTA',
    motivo: 'INGRESO SIN COBRO (MOTO)',
    placa: 'ABC12D',
    ocurridoEn: '2026-11-24T12:00:00.000Z',
    ...sobre,
  }
}

describe('aplicarBarrera', () => {
  it('abre la barrera del carril cuando llega un evento ABIERTA de ese carril', () => {
    const estado = aplicarBarrera(CARRIL_SIN_LECTURAS, evento(), 'ENTRADA')

    expect(estado.estado).toBe('ABIERTA')
    expect(estado.placa).toBe('ABC12D')
    expect(estado.motivo).toBe('INGRESO SIN COBRO (MOTO)')
  })

  it('pasa a CERRADA cuando el siguiente evento es un denegado', () => {
    const abierta = aplicarBarrera(CARRIL_SIN_LECTURAS, evento(), 'ENTRADA')
    const cerrada = aplicarBarrera(abierta, evento({ estado: 'CERRADA', motivo: 'LLENO' }), 'ENTRADA')

    expect(cerrada.estado).toBe('CERRADA')
    expect(cerrada.motivo).toBe('LLENO')
  })

  it('ignora los eventos del otro carril', () => {
    const entrada = aplicarBarrera(CARRIL_SIN_LECTURAS, evento(), 'ENTRADA')
    const despues = aplicarBarrera(entrada, evento({ carril: 'SALIDA', estado: 'CERRADA' }), 'ENTRADA')

    expect(despues).toEqual(entrada)
  })

  it('no modifica el estado anterior', () => {
    aplicarBarrera(CARRIL_SIN_LECTURAS, evento(), 'ENTRADA')

    expect(CARRIL_SIN_LECTURAS.estado).toBe(null)
  })
})

describe('debeReconectarManualmente', () => {
  it('es true cuando el servidor cierra la conexión (Socket.IO no reintenta solo)', () => {
    expect(debeReconectarManualmente('io server disconnect')).toBe(true)
  })

  it('es false cuando se cae la red (Socket.IO reconecta solo)', () => {
    expect(debeReconectarManualmente('transport close')).toBe(false)
    expect(debeReconectarManualmente('ping timeout')).toBe(false)
    expect(debeReconectarManualmente('transport error')).toBe(false)
  })
})