
BEGIN;

-- Protección: ejecutar exclusivamente en la base de pruebas.
DO $$
BEGIN
  IF current_database() <> 'parqueadero_test' THEN
    RAISE EXCEPTION 'Esta prueba solo puede ejecutarse en parqueadero_test';
  END IF;
END
$$;

-- Sede de pruebas
INSERT INTO sedes (
  id, nombre, zona_horaria,
  inicio_dia_operativo,
  inicio_franja_diurna,
  inicio_franja_nocturna
)
VALUES (
  'act020-sede',
  'ACT020-SCHEDULER-TEST',
  'America/Bogota',
  '06:00',
  '06:00',
  '18:00'
);

-- Vehículo
INSERT INTO vehiculos (id, placa, tipo)
VALUES ('act020-vehiculo', 'TST020', 'CARRO');

-- Espacio ocupado
INSERT INTO espacios (
  id, sede_id, codigo, zona,
  tipo_compatible, estado
)
VALUES (
  'act020-espacio',
  'act020-sede',
  'ACT020-E01',
  'PRUEBAS',
  'CARRO',
  'OCUPADO'
);

-- Carril de entrada
INSERT INTO carriles (id, sede_id, nombre, sentido)
VALUES (
  'act020-carril',
  'act020-sede',
  'ACT020-ENTRADA',
  'ENTRADA'
);

-- Evento de ingreso: 05:20 hora Colombia = 10:20 UTC
INSERT INTO eventos_acceso (
  id, sede_id, carril_id, placa,
  vehiculo_id, tipo, espacio_id, ocurrido_en
)
VALUES (
  'act020-evento',
  'act020-sede',
  'act020-carril',
  'TST020',
  'act020-vehiculo',
  'INGRESO',
  'act020-espacio',
  '2026-11-20 10:20:00+00'
);

-- Permanencia activa
INSERT INTO permanencias (
  id, vehiculo_id, espacio_id,
  evento_ingreso_id, ingreso_en,
  vehiculo_activo_id, espacio_activo_id
)
VALUES (
  'act020-permanencia',
  'act020-vehiculo',
  'act020-espacio',
  'act020-evento',
  '2026-11-20 10:20:00+00',
  'act020-vehiculo',
  'act020-espacio'
);

-- Tarifa diurna vigente desde antes del ingreso
INSERT INTO tarifas (
  id, sede_id, tipo_vehiculo,
  franja, valor, version, vigente_desde
)
VALUES (
  'act020-tarifa-diurna',
  'act020-sede',
  'CARRO',
  'DIURNA',
  10000.00,
  1,
  '2026-11-01 00:00:00+00'
);

-- Tarifa nocturna
INSERT INTO tarifas (
  id, sede_id, tipo_vehiculo,
  franja, valor, version, vigente_desde
)
VALUES (
  'act020-tarifa-nocturna',
  'act020-sede',
  'CARRO',
  'NOCTURNA',
  5000.00,
  1,
  '2026-11-01 00:00:00+00'
);

COMMIT;
