# ACT-037 — Pruebas de reglas de negocio

## 1. Objetivo

Verificar el cumplimiento de las reglas de negocio del sistema inteligente de administración de parqueaderos mediante pruebas automatizadas, utilizando un reloj controlado y una base de datos PostgreSQL independiente del entorno principal.

## 2. Alcance

La actividad comprende los nueve escenarios originales del contexto del problema, los casos complementarios TC-09 a TC-15, los límites horarios, el versionamiento de tarifas, la unicidad de cobros y la consistencia de las operaciones concurrentes.

## 3. Implementación técnica

Se implementó un reloj controlado que permite establecer fechas y horas específicas durante las pruebas.

El servicio VerificarCambioDiaService fue adaptado para utilizar la interfaz Reloj mediante inyección de dependencias, conservando el comportamiento del reloj del sistema en producción.

Las pruebas utilizan los casos de uso y repositorios reales del backend, con persistencia en PostgreSQL. La emisión de notificaciones WebSocket se sustituye por un doble de prueba dentro de la suite de escenarios.

## 4. Escenarios verificados

| Identificador | Descripción | Resultado |
|---|---|---|
| ESC-01 | Ingreso y salida de motocicleta sin cobro | Aprobado |
| ESC-02 | Pago obligatorio antes de la salida | Aprobado |
| ESC-03 | Reingreso diurno con pago vigente | Aprobado |
| ESC-04 | Reingreso nocturno con pago diurno vigente | Aprobado |
| ESC-05 | Primer ingreso nocturno | Aprobado |
| ESC-06 | Permanencia durante el cruce de medianoche | Aprobado |
| ESC-07 | Generación de cobro por cambio de día operativo | Aprobado |
| ESC-08 | Nuevo cobro en el siguiente día operativo | Aprobado |
| ESC-09 | Validación manual de lectura y auditoría | Aprobado |
| TC-09 | Salida antes de las 06:00 conserva tarifa nocturna | Aprobado |
| TC-10 | Permanencia después de las 06:00 genera nuevo cobro | Aprobado |
| TC-11 | Pase vigente no garantiza disponibilidad | Aprobado |
| TC-12 | Reingreso cuando se libera un espacio | Aprobado |
| TC-13 | Concurrencia por el último espacio | Aprobado |
| TC-14 | Salida denegada conserva la ocupación | Aprobado |
| TC-15 | Discrepancia de clasificación genera alerta | Aprobado |

## 5. Pruebas complementarias

- Límites horarios: 05:59:59, 06:00:00, 17:59:59 y 18:00:00.
- Conservación de cobros históricos después del versionamiento de tarifas.
- Rechazo de tarifa nocturna superior a la diurna.
- Rechazo de tarifa nocturna igual a la diurna para carros.
- Unicidad de cobros y permanencias ante ingresos simultáneos de una misma placa.
- Exención de motocicletas durante varios días operativos.
- Preparación independiente de los datos de cada escenario.

## 6. Entorno de pruebas

- Backend: NestJS y TypeScript.
- Motor de base de datos: PostgreSQL.
- ORM: Prisma.
- Framework de pruebas: Jest.
- Infraestructura local: Docker Compose.
- Zona horaria operativa: America/Bogota.
- Base de datos exclusiva: parqueadero_act037_test.
- Puerto local utilizado: 5433.

Las pruebas deben ejecutarse exclusivamente sobre una base de datos de pruebas. La suite elimina y reconstruye sus datos entre escenarios, por lo que no debe apuntar a la base de datos principal.

## 7. Ejecución

Desde la carpeta backend, configurar temporalmente DATABASE_URL para apuntar a la base de datos parqueadero_act037_test, previamente creada y migrada.

Ejecutar:

`npx jest --config ./test/jest-escenarios.json --runInBand --verbose`

Restaurar la variable de entorno original al finalizar.

## 8. Resultados obtenidos

Fecha de ejecución: 25 de noviembre de 2026.

| Grupo | Suites aprobadas | Pruebas aprobadas |
|---|---:|---:|
| Regresión general del backend | 35 | 276 |
| Integración ACT-020 | 1 | 6 |
| Escenarios ACT-037 | 1 | 26 |
| Pruebas E2E | 5 | 29 |
| Total | 42 | 337 |

Las cinco pruebas unitarias del servicio de cambio de día están incluidas en la regresión general.

La suite específica de ACT-037 registró 26 pruebas aprobadas, cero fallidas y un tiempo de ejecución de 5.209 segundos.

También se verificó la compilación del backend, el formato del código, ESLint y la ausencia de errores de espacios en los cambios de Git.

## 9. Consideraciones y limitaciones

- ESC-09 verifica la corrección manual de la detección y su auditoría. No demuestra la vinculación de la detección corregida con un evento de acceso.
- El versionamiento de tarifas utiliza el reloj del sistema. La prueba ajusta el reloj controlado según la fecha de vigencia obtenida de la nueva versión.
- Las pruebas de ocupación complementan la cobertura de otras actividades de integración del proyecto.
- La emisión real de notificaciones WebSocket no forma parte de la suite de escenarios de negocio.
- Se corrigieron los dobles de PrismaService en cuatro archivos E2E. La ejecución definitiva de las 29 pruebas E2E finalizó correctamente y sin errores de inicialización del servicio de cambio de día.

## 10. Conclusión

Las pruebas ejecutadas demuestran el cumplimiento de las reglas de negocio evaluadas, incluyendo el cambio de día operativo, la conservación de pagos vigentes, la exención de motocicletas, el versionamiento de tarifas y la consistencia de la ocupación.

Se aprobaron 337 pruebas diferentes distribuidas en 42 suites, sin pruebas fallidas. También se verificó la compilación del backend, el formato del código, ESLint y la ejecución de las pruebas E2E sin errores de inicialización.

Las pruebas que requieren persistencia se ejecutaron utilizando bases de datos independientes del entorno principal.

La implementación y validación técnica de ACT-037 se encuentran finalizadas. Queda pendiente la publicación de los cambios, la revisión del Pull Request y su incorporación a la rama develop.