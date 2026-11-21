import { SimuladorLectorPlacas } from './simulador-lector-placas';

describe('SimuladorLectorPlacas', () => {
  const lector = new SimuladorLectorPlacas();
  const hora = new Date('2026-11-20T15:00:00Z');
  const captura = {
    carrilId: 'carril-1',
    ocurridaEn: hora,
    placa: ' abc-123 ',
    confianza: 0.9,
  };

  it('marca la lectura con origen SIMULADOR', async () => {
    const lectura = await lector.leer(captura);
    expect(lectura.origen).toBe('SIMULADOR');
  });

  it('normaliza la placa', async () => {
    const lectura = await lector.leer(captura);
    expect(lectura.placa).toBe('ABC123');
  });

  it('conserva la confianza y la hora', async () => {
    const lectura = await lector.leer(captura);
    expect(lectura.confianza).toBe(0.9);
    expect(lectura.ocurridaEn).toEqual(hora);
  });

  it('devuelve tipoVisual null si no se informa y lo conserva si se informa', async () => {
    const sinTipo = await lector.leer(captura);
    const conTipo = await lector.leer({ ...captura, tipoVisual: 'MOTO' });

    expect(sinTipo.tipoVisual).toBeNull();
    expect(conTipo.tipoVisual).toBe('MOTO');
  });
});
