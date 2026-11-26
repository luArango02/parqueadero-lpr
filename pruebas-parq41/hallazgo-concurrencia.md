# Hallazgo de concurrencia en ingresos simultáneos

## Identificación

- Actividad de detección: PARQ-41.
- Suite: escenarios de reglas de negocio de PARQ-40.
- Fecha: 25/11/2026.
- Estado: pendiente de corrección.
- Prioridad sugerida: alta.

## Descripción

Durante la regresión final se identificó una condición de carrera
al procesar simultáneamente dos solicitudes de ingreso de una
misma placa.

La validación de permanencia activa se realiza antes de iniciar
la transacción de registro. Dos solicitudes concurrentes pueden
superar esta comprobación.

El repositorio reintenta las operaciones que generan errores
P2002 sin distinguir adecuadamente el origen del conflicto.

## Evidencia

Prueba fallida:

RN-04: ingresos simultaneos de una misma placa no duplican
cobros ni permanencias.

Error observado:

PrismaClientKnownRequestError
Unique constraint failed on the fields: (vehiculo_activo_id)

Archivo:

backend/src/infrastructure/repositories/prisma-ingreso.repositorio.ts

Operación observada:

tx.permanencia.create()

## Comportamiento esperado

- Autorizar únicamente uno de los ingresos simultáneos.
- Denegar el segundo ingreso mediante una respuesta controlada.
- Mantener cerrada la barrera del ingreso denegado.
- Registrar el evento y la alerta anti-passback correspondiente.
- Evitar cobros, vehículos y permanencias duplicadas.
- Conservar la consistencia de la ocupación.

## Análisis del alcance

Se verificó que el repositorio de ingresos, el caso de uso y la
prueba de escenarios coinciden con origin/develop.

No se identificaron modificaciones de PARQ-41 en esos archivos.

La restricción de unicidad de PostgreSQL impide la inserción de
una segunda permanencia activa. Sin embargo, la excepción se
propaga en lugar de producir una denegación controlada.

## Tratamiento propuesto

Registrar una actividad correctiva independiente en Jira.

La corrección debe mantener las restricciones de unicidad,
gestionar los conflictos de concurrencia y conservar las
comprobaciones originales de PARQ-40.

No se modificó ni deshabilitó la prueba fallida.

## Impacto sobre el cierre

La regresión final ejecutó 422 pruebas Jest:

- 421 aprobadas.
- 1 fallida.

No se declara una regresión funcional completamente aprobada.
El cierre y merge de PARQ-41 quedan sujetos a las políticas de
calidad y a la aprobación del equipo.