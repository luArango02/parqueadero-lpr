
BEGIN;

-- Seguridad: impedir la ejecución fuera de la base de pruebas.
DO $$
BEGIN
  IF current_database() <> 'parqueadero_test' THEN
    RAISE EXCEPTION 'Limpieza permitida solo en parqueadero_test';
  END IF;
END
$$;

-- Eliminar exclusivamente las auditorías de los cobros ACT-020.
DELETE FROM auditoria
WHERE entidad = 'Cobro'
  AND entidad_id IN (
    SELECT id
    FROM cobros
    WHERE sede_id = 'act020-sede'
      AND vehiculo_id = 'act020-vehiculo'
      AND placa = 'TST020'
  );

-- Eliminar cobros de la prueba.
DELETE FROM cobros
WHERE sede_id = 'act020-sede'
  AND vehiculo_id = 'act020-vehiculo'
  AND placa = 'TST020';

-- Eliminar la permanencia activa.
DELETE FROM permanencias
WHERE id = 'act020-permanencia'
  AND vehiculo_id = 'act020-vehiculo';

-- Eliminar evento de ingreso.
DELETE FROM eventos_acceso
WHERE id = 'act020-evento'
  AND sede_id = 'act020-sede';

-- Eliminar tarifas de prueba.
DELETE FROM tarifas
WHERE id IN (
  'act020-tarifa-diurna',
  'act020-tarifa-nocturna'
)
AND sede_id = 'act020-sede';

-- Eliminar carril y espacio.
DELETE FROM carriles
WHERE id = 'act020-carril'
  AND sede_id = 'act020-sede';

DELETE FROM espacios
WHERE id = 'act020-espacio'
  AND sede_id = 'act020-sede';

-- Eliminar vehículo.
DELETE FROM vehiculos
WHERE id = 'act020-vehiculo'
  AND placa = 'TST020';

-- Eliminar sede.
DELETE FROM sedes
WHERE id = 'act020-sede'
  AND nombre = 'ACT020-SCHEDULER-TEST';

COMMIT;
