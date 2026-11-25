// Reglas del formulario de tarifas, sin Vue: así se pueden probar solas.
// Son las mismas del backend (RN-01 y RN-02); el backend vuelve a validar.

export type TipoVehiculo = 'CARRO' | 'MOTO'
export type Franja = 'DIURNA' | 'NOCTURNA'

/** Un elemento de GET /api/tarifas/vigentes. El valor llega como texto ("8000.00"). */
export interface TarifaVigente {
  id: string
  tipoVehiculo: TipoVehiculo
  franja: Franja
  valor: string
  version: number
  vigenteDesde: string
}

export interface ParTarifas {
  tipoVehiculo: TipoVehiculo
  version: number
  diurna: number
  nocturna: number
}

export interface ErroresTarifa {
  diurna?: string
  nocturna?: string
}

export function agruparPorTipo(tarifas: TarifaVigente[]): ParTarifas[] {
  const tipos: TipoVehiculo[] = ['CARRO', 'MOTO']
  return tipos
    .map((tipo) => {
      const diurna = tarifas.find((t) => t.tipoVehiculo === tipo && t.franja === 'DIURNA')
      const nocturna = tarifas.find((t) => t.tipoVehiculo === tipo && t.franja === 'NOCTURNA')
      if (!diurna || !nocturna) return null
      return {
        tipoVehiculo: tipo,
        version: diurna.version,
        diurna: Number(diurna.valor),
        nocturna: Number(nocturna.valor),
      }
    })
    .filter((par): par is ParTarifas => par !== null)
}

export function validarTarifas(par: Pick<ParTarifas, 'tipoVehiculo' | 'diurna' | 'nocturna'>): ErroresTarifa {
  const errores: ErroresTarifa = {}
  const valido = (valor: number) => Number.isFinite(valor) && valor >= 0

  if (!valido(par.diurna)) errores.diurna = 'Debe ser un número mayor o igual a 0'
  if (!valido(par.nocturna)) errores.nocturna = 'Debe ser un número mayor o igual a 0'
  if (errores.diurna || errores.nocturna) return errores

  // RN-01: la moto puede quedar gratis en ambas franjas.
  const motoGratis = par.tipoVehiculo === 'MOTO' && par.diurna === 0 && par.nocturna === 0
  // RN-02: la nocturna debe ser menor que la diurna.
  if (!motoGratis && par.nocturna >= par.diurna) {
    errores.nocturna = 'La tarifa nocturna debe ser menor que la diurna'
  }
  return errores
}
