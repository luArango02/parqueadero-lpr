# Evidencias de validación - PARQ-41

## 1. Objetivo

Documentar y verificar los contratos HTTP implementados en el
backend del sistema de administración de parqueaderos mediante
Swagger/OpenAPI y una colección reproducible de Bruno.

## 2. Entregables

- Documentación Swagger de las operaciones implementadas.
- DTO de respuesta y esquemas de errores HTTP.
- Colección Bruno organizada por módulos.
- Manifiesto de regresión de flujos integrados.
- Ejecutor automatizado mediante PowerShell.
- Evidencias de validación de contratos y regresión.

## 3. Resultados consolidados

| Verificación | Resultado |
|---|---:|
| Rutas OpenAPI | 28 |
| Operaciones documentadas | 33/33 |
| Esquemas OpenAPI | 45 |
| Solicitudes Bruno distintas | 180 |
| Bloques de regresión Bruno | 11/11 |
| Ejecuciones de solicitudes Bruno | 221/221 |
| Pruebas Bruno | 790/790 |
| Validaciones AJV | 62/62 |
| Contratos HTTP reales | 34/34 |
| Pruebas unitarias Jest | 317/317 |
| Integraciones de repositorios | 26/26 |
| Pruebas E2E | 41/41 |
| Escenarios PARQ-40 | 25/26 |
| Integración de accesos y espacios | 12/12 |
| Total Jest | 421/422 |
| Suites Jest aprobadas | 48/49 |

La suma de comprobaciones de Bruno, AJV, HTTP y Jest es de
1307 aprobadas sobre 1308 ejecutadas. No representa un conteo
de casos funcionales únicos.

## 4. Entorno de ejecución

- Windows y PowerShell.
- Node.js 24.
- NestJS y TypeScript.
- Prisma y PostgreSQL 16.
- Docker.
- Bruno CLI 4.4.0.
- Jest.
- Redocly CLI.
- AJV 8.17.1 y ajv-formats 3.0.1.

Las verificaciones con PostgreSQL se realizaron utilizando bases
de pruebas independientes de la base principal de desarrollo.

La regresión completa de Bruno se ejecutó sobre una base limpia
con migraciones y datos iniciales aplicados.

## 5. Verificación de persistencia

Después de ejecutar la regresión Bruno se verificaron:

- Unicidad de cobros y referencias de pago.
- Consistencia entre pagos y cobros.
- Exención de motocicletas.
- Versionamiento de tarifas.
- Consistencia entre espacios y permanencias.
- Registro de alertas.
- Auditoría con identificación del usuario responsable.

## 6. Adaptación temporal de las integraciones

Las suites de accesos y espacios tenían una configuración fija
para PostgreSQL en el puerto 5433.

Para evitar conflictos y proteger las bases existentes, se creó
un contenedor PostgreSQL desechable en el puerto 5434.

Se utilizaron copias temporales de las pruebas, adaptando
exclusivamente las referencias al puerto y conservando las
protecciones de conexión.

Las dos suites aprobaron sus 12 pruebas.

La copia temporal y el contenedor fueron eliminados después
de la ejecución. Los archivos originales no se modificaron.

## 7. Archivos de evidencia

| Archivo | Contenido |
|---|---|
| openapi.json | Contrato OpenAPI definitivo |
| resumen-regresion-bruno.json | Resultados de los 11 bloques |
| resultados-validacion-openapi.txt | Validaciones consolidadas |
| resultados-contratos-http.json | Resultados de respuestas reales |
| resultados-jest.txt | Resultados extraídos de Jest |
| hallazgo-concurrencia.md | Defecto funcional pendiente |

Los reportes completos permanecen en el entorno local de
ejecución. Se versionan resultados seleccionados para reducir
la exposición de información sensible.

## 8. Limitaciones y estado

La documentación Swagger y la colección Bruno fueron
implementadas y verificadas.

La regresión funcional identificó una condición de carrera
preexistente en los ingresos simultáneos de una misma placa.

El defecto no fue corregido dentro del alcance de PARQ-41.
Consultar hallazgo-concurrencia.md.

El resultado de Jest no es del 100 % y el cierre definitivo
requiere revisión y aprobación del equipo.