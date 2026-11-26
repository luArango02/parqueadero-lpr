# Parqueadero LPR - Colección Bruno

## 1. Objetivo

Colección de solicitudes HTTP y pruebas automatizadas para
verificar las operaciones implementadas en el backend del
sistema de administración de parqueaderos.

Actividad: PARQ-41.

## 2. Alcance

- 33 operaciones HTTP documentadas mediante Swagger/OpenAPI.
- 180 solicitudes Bruno distintas.
- 11 bloques de regresión.
- 221 ejecuciones de solicitudes.
- 790 pruebas automatizadas.

La colección incluye operaciones exitosas, validaciones,
autenticación, autorización y errores HTTP.

## 3. Organización

| Carpeta | Solicitudes |
|---|---:|
| 01-Salud | 1 |
| 02-Autenticacion | 7 |
| 03-Usuarios | 9 |
| 04-Sedes | 1 |
| 05-Vehiculos | 7 |
| 06-Tarifas | 26 |
| 07-Espacios-y-cupos | 26 |
| 08-Accesos | 9 |
| 09-Cobros | 7 |
| 10-Pagos | 9 |
| 11-Pases | 3 |
| 12-Detecciones | 10 |
| 13-Alertas | 14 |
| 14-Eventos | 24 |
| 15-Auditoria | 27 |
| Total | 180 |

## 4. Requisitos

- Node.js y npm.
- Docker y Docker Compose.
- PostgreSQL con las migraciones del proyecto.
- Backend NestJS compilado.
- PowerShell para el ejecutor automatizado.
- Bruno CLI 4.4.0.
- Bruno Desktop, opcional para ejecución manual.

Consultar el README principal del proyecto para la instalación
de dependencias y la configuración general.

## 5. Entorno Local

El archivo environments/Local.bru define:

- baseUrl: http://localhost:3001
- adminEmail: admin@parqueadero.local
- operadorEmail: operador@parqueadero.local
- adminPassword: sin valor versionado.
- operadorPassword: sin valor versionado.

Utilizar exclusivamente usuarios y credenciales de pruebas.

No guardar contraseñas, tokens JWT ni conexiones privadas
en los archivos versionados.

## 6. Documentación Swagger

Con el backend de pruebas ejecutándose en el puerto 3001:

- Swagger UI: http://localhost:3001/docs
- OpenAPI JSON: http://localhost:3001/docs-json
- Health: http://localhost:3001/health

El contrato OpenAPI validado se encuentra en:

../pruebas-parq41/openapi.json

## 7. Preparación de la regresión

La regresión completa requiere una base PostgreSQL aislada
llamada parqueadero_parq41_regresion_test.

Debe contener las migraciones y los datos iniciales del
proyecto, sin operaciones previas.

Estado inicial requerido:

- Una sede.
- Dos carriles.
- Dos usuarios.
- Quince espacios disponibles.
- Cuatro tarifas.
- Cero vehículos, cobros, pagos y permanencias.
- Cero alertas, detecciones, eventos y auditorías.

El backend debe ejecutarse en el puerto 3001 y utilizar
exclusivamente esa base.

El ejecutor verifica el identificador de la sede del backend
contra el identificador almacenado en PostgreSQL.

No utilizar la base principal de desarrollo ni producción.

El ejecutor no crea, reinicia ni elimina bases de datos.
La preparación del entorno es responsabilidad del ejecutor
humano y debe realizarse antes de iniciar la regresión.

## 8. Ejecución automatizada

Desde la raíz del repositorio:

    powershell -NoProfile -ExecutionPolicy Bypass -File .\bruno\ejecutar-regresion.ps1

El script solicitará las contraseñas del administrador y
del operador de pruebas.

También se puede especificar el directorio de reportes:

    powershell -NoProfile -ExecutionPolicy Bypass -File .\bruno\ejecutar-regresion.ps1 -DirectorioReportes "$env:TEMP\parq41-reportes"

Por defecto, los reportes se guardan en una carpeta temporal
con fecha y hora de ejecución.

El parámetro ExecutionPolicy afecta únicamente al proceso
de PowerShell iniciado mediante ese comando.

## 9. Secuencia de regresión

El archivo regresion.json define el orden de las solicitudes.

| Bloque | Solicitudes | Pruebas |
|---|---:|---:|
| 01 | 7 | 28 |
| 02 | 16 | 50 |
| 03A | 17 | 83 |
| 03B | 14 | 70 |
| 04A | 16 | 63 |
| 04B | 17 | 71 |
| 05A | 28 | 99 |
| 05B | 26 | 83 |
| 06A | 26 | 67 |
| 06B | 29 | 72 |
| 07A | 25 | 104 |
| Total | 221 | 790 |

Algunas solicitudes se reutilizan en diferentes bloques.

No ejecutar indiscriminadamente toda la colección mediante
un recorrido recursivo de carpetas: existen dependencias
entre solicitudes y datos generados durante los flujos.

## 10. Ejecución manual mediante Bruno Desktop

1. Abrir Bruno.
2. Seleccionar Open Collection.
3. Abrir la carpeta bruno del repositorio.
4. Seleccionar el entorno Local.
5. Configurar las credenciales de pruebas sin versionarlas.
6. Ejecutar las solicitudes de autenticación necesarias.
7. Ejecutar las solicitudes respetando sus dependencias.

Las operaciones protegidas requieren tokens válidos.
Algunas solicitudes dependen de identificadores generados
por solicitudes anteriores.

## 11. Reportes

El ejecutor genera:

- Un archivo JSON por bloque.
- Un archivo resumen.json consolidado.

Se comprueban las solicitudes aprobadas, fallidas, omitidas
y los resultados de las pruebas automatizadas.

Los reportes se generan sin cuerpos ni encabezados HTTP.
No publicar reportes completos sin revisar su contenido.

## 12. Seguridad y limitaciones

La regresión modifica los datos de la base de pruebas.

No debe repetirse sobre una base utilizada previamente.
El ejecutor rechaza una base que no tenga el estado inicial.

Algunas solicitudes utilizan fechas fijas de noviembre de
2026 para comprobar las reglas horarias. Los datos iniciales
de tarifas deben cubrir esas fechas.

Las contraseñas se solicitan de forma oculta, pero se
transfieren temporalmente al proceso de Bruno como argumentos
CLI. Utilizar únicamente credenciales de pruebas.

La regresión fue verificada con Bruno CLI 4.4.0.

## 13. Resultados y evidencias

Consultar:

- ../pruebas-parq41/README.md
- ../pruebas-parq41/resumen-regresion-bruno.json
- ../pruebas-parq41/resultados-jest.txt
- ../pruebas-parq41/hallazgo-concurrencia.md

La regresión Bruno aprobó sus 221 ejecuciones y 790 pruebas.

La regresión Jest aprobó 421 de 422 pruebas. El defecto
pendiente de concurrencia está documentado por separado.