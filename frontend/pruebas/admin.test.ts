import { describe, expect, it } from 'vitest'
import { agruparPorTipo, validarTarifas, type TarifaVigente } from '../src/admin/tarifas'

describe('validarTarifas', () => {
  it('acepta una nocturna menor que la diurna', () => {
    expect(validarTarifas({ tipoVehiculo: 'CARRO', diurna: 8000, nocturna: 5000 })).toEqual({})
  })

  it('marca el campo nocturna si es mayor o igual a la diurna (RN-02)', () => {
    expect(validarTarifas({ tipoVehiculo: 'CARRO', diurna: 5000, nocturna: 5000 })).toEqual({
      nocturna: 'La tarifa nocturna debe ser menor que la diurna',
    })
  })

  it('permite la moto gratis en las dos franjas (RN-01)', () => {
    expect(validarTarifas({ tipoVehiculo: 'MOTO', diurna: 0, nocturna: 0 })).toEqual({})
  })

  it('un carro en 0 y 0 no pasa, porque la nocturna no es menor', () => {
    expect(validarTarifas({ tipoVehiculo: 'CARRO', diurna: 0, nocturna: 0 }).nocturna).toBeDefined()
  })

  it('rechaza valores negativos o vacíos en el campo que corresponde', () => {
    expect(validarTarifas({ tipoVehiculo: 'CARRO', diurna: -1, nocturna: 500 })).toEqual({
      diurna: 'Debe ser un número mayor o igual a 0',
    })
    expect(validarTarifas({ tipoVehiculo: 'CARRO', diurna: 8000, nocturna: NaN }).nocturna).toBe(
      'Debe ser un número mayor o igual a 0',
    )
  })
})

describe('agruparPorTipo', () => {
  const tarifa = (tipoVehiculo: 'CARRO' | 'MOTO', franja: 'DIURNA' | 'NOCTURNA', valor: string) =>
    ({ id: `${tipoVehiculo}-${franja}`, tipoVehiculo, franja, valor, version: 2, vigenteDesde: '' }) as TarifaVigente

  it('arma un par diurna/nocturna por tipo con valores numéricos', () => {
    const pares = agruparPorTipo([
      tarifa('MOTO', 'NOCTURNA', '0.00'),
      tarifa('CARRO', 'DIURNA', '8000.00'),
      tarifa('CARRO', 'NOCTURNA', '5000.00'),
      tarifa('MOTO', 'DIURNA', '0.00'),
    ])

    expect(pares).toEqual([
      { tipoVehiculo: 'CARRO', version: 2, diurna: 8000, nocturna: 5000 },
      { tipoVehiculo: 'MOTO', version: 2, diurna: 0, nocturna: 0 },
    ])
  })

  it('omite un tipo si le falta una franja', () => {
    expect(agruparPorTipo([tarifa('CARRO', 'DIURNA', '8000.00')])).toEqual([])
  })
})
