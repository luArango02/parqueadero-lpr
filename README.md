# parqueadero-lpr

MVP de un sistema de parqueadero con reconocimiento de placas (LPR: *License Plate Recognition*).
Proyecto de **Ingeniería de Software II** — Universidad Autónoma de Manizales.

## Equipo

| Integrante | Rol Scrum |
|---|---|
| Sergio Alexander Castro López | Product Owner |
| Luis Felipe González López | Scrum Master |
| Luisa María Arango López | Equipo de desarrollo |

Los tres integrantes desarrollan código. Tablero: Jira (proyecto PARQ).

## Stack

| Parte | Tecnología |
|---|---|
| Backend | NestJS + TypeScript |
| Frontend | Vue 3 + Vite |
| Base de datos | PostgreSQL + Prisma |
| Tiempo real | Socket.IO |
| Pruebas | Jest |
| Ejecución local | Docker Compose |
| Nube (opcional) | Render + Neon |

## Estructura

```
backend/    API NestJS (arquitectura hexagonal)
frontend/   Aplicación Vue 3 (pendiente, ACT-003)
docs/       Documentación del proyecto
```

## Cómo ejecutar con Docker Compose

Requisitos: Docker Desktop abierto.

```bash
cp .env.example .env          # en PowerShell: copy .env.example .env
docker compose up --build     # levanta PostgreSQL y el backend
```

Comprobar: abrir http://localhost:3000/health

| Comando | Para qué |
|---|---|
| `docker compose up --build -d` | Levantar todo en segundo plano |
| `docker compose up db -d` | Levantar solo la base de datos (para desarrollar con `npm run start:dev`) |
| `docker compose ps` | Ver el estado de los servicios |
| `docker compose logs -f backend` | Ver los logs del backend |
| `docker compose down` | Apagar todo; los datos se conservan |
| `docker compose down -v` | Apagar y **borrar** los datos de la base |

Al arrancar, el contenedor del backend aplica las migraciones pendientes (`prisma migrate deploy`).

## Documentación de la API (Swagger)

Con el backend corriendo, abrir http://localhost:3000/docs. Ahí aparecen todos los endpoints y se pueden probar desde el navegador.

Ejemplo: en **Accesos → POST /api/accesos/ingreso**, *Try it out*, con el cuerpo `{ "placa": "ABC123" }` registra el ingreso de un carro. La respuesta indica si la barrera abre, el espacio asignado y el cobro generado.

### Colección Bruno y validación de contratos

La documentación OpenAPI incluye los esquemas de respuesta,
ejemplos, errores HTTP y requisitos de autenticación de las
operaciones implementadas.

- OpenAPI JSON: http://localhost:3000/docs-json
- [Colección Bruno y guía de ejecución](bruno/README.md).
- [Contrato OpenAPI validado](pruebas-parq41/openapi.json).
- [Evidencias de validación PARQ-41](pruebas-parq41/README.md).
- [Hallazgo de concurrencia pendiente](pruebas-parq41/hallazgo-concurrencia.md).

La colección Bruno contiene 180 solicitudes distintas y un
ejecutor automatizado de 11 bloques de regresión.

Para ejecutar la regresión completa se requiere un backend
independiente en el puerto 3001 y una base de pruebas aislada,
según las instrucciones de la colección.

No ejecutar los flujos automatizados sobre la base principal
de desarrollo ni sobre producción.


## Autenticación y roles

1. `POST /api/auth/login` con correo y clave devuelve un `accessToken` (JWT, dura `JWT_EXPIRES_IN`).
2. Las rutas privadas se llaman con el encabezado `Authorization: Bearer <token>`. En Swagger: botón **Authorize**.
3. Sin token o con un token inválido la API responde **401**; con un rol sin permiso responde **403**.

| Endpoint | Quién |
|---|---|
| `GET /api/auth/profile` | Cualquier usuario autenticado |
| `GET /api/usuarios`, `POST /api/usuarios`, `PATCH /api/usuarios/{id}` | Solo `ADMINISTRADOR` |
| `POST/PATCH /api/tarifas`, `POST/PATCH /api/espacios` | Solo `ADMINISTRADOR`; cada cambio queda en `auditoria` |

Las claves se guardan con bcrypt y cada creación o modificación de usuarios queda en la tabla `auditoria`.

En el frontend, la pantalla **Admin** (`/admin`) pide iniciar sesión con un administrador y permite cambiar tarifas (con la validación de nocturna menor que diurna junto al campo), poner espacios fuera de servicio y agregar espacios. El mapa y el panel se actualizan solos con esos cambios.

Para auditar un endpoint se agrega `@Auditar('ACCION', 'Entidad')` junto a `@Autenticado(...)`.

Para proteger un endpoint nuevo basta con el decorador `@Autenticado()` (cualquier rol) o `@Autenticado('ADMINISTRADOR')` en el controlador o en el método.

## Eventos en tiempo real (Socket.IO)

El backend publica eventos por Socket.IO en el mismo puerto de la API (`http://localhost:3000`, ruta `/socket.io`). En desarrollo, el proxy de Vite ya reenvía `/socket.io`, así que desde el frontend basta con:

```ts
import { io } from 'socket.io-client'
const socket = io()
socket.on('ocupacion:actualizada', (datos) => { /* ... */ })
```

Los eventos se emiten solo después de guardar en la base de datos.

| Evento | Cuándo | Datos |
|---|---|---|
| `barrera:actualizada` | En cada lectura de entrada o salida, autorizada o no | `{ carril: 'ENTRADA' \| 'SALIDA', estado: 'ABIERTA' \| 'CERRADA', motivo, placa, ocurridoEn }` |
| `acceso:ingreso` | Cuando un vehículo entra | `{ placa, tipoVehiculo, espacio, cobro, reingreso, ocurridoEn }` |
| `acceso:salida` | Cuando un vehículo sale | `{ placa, tipoVehiculo, espacioLiberado, minutosDentro, ocurridoEn }` |
| `ocupacion:actualizada` | Al conectarse y después de cada ingreso o salida | `{ total, disponibles, ocupados, fueraDeServicio, porTipo: { CARRO: {...}, MOTO: {...} }, actualizadoEn }` |

`cobro` es `null` o `{ id, valor, franja, estado, diaOperativo }`. `ocurridoEn` y `actualizadoEn` van en formato ISO.

Para emitir desde otro módulo (por ejemplo, al poner un espacio fuera de servicio), se inyecta `EventosGateway` y se llama `emitir(EVENTOS.ocupacion, await consultaOcupacion.resumen())`.

## Cómo ejecutar el backend sin Docker (desarrollo)

```bash
docker compose up db -d       # solo la base de datos
cd backend
npm install                   # también genera el cliente de Prisma
cp .env.example .env
npm run prisma:migrate        # crea/actualiza las tablas
npm run db:seed               # datos de prueba
npm run start:dev
```

## Base de datos (Prisma)

- Modelo: `backend/prisma/schema.prisma`. Migraciones: `backend/prisma/migrations/`.
- Para cambiar el modelo: editar `schema.prisma` y ejecutar `npm run prisma:migrate -- --name descripcion-del-cambio`.
- Ver los datos en el navegador: `npx prisma studio`.
- El seed crea la sede "Sede Principal", 2 carriles, 10 espacios de carro (A-01 a A-10), 5 de moto (M-01 a M-05), las tarifas versión 1 y dos usuarios de prueba:

| Usuario | Contraseña | Rol |
|---|---|---|
| admin@parqueadero.local | Admin123* | Administrador |
| operador@parqueadero.local | Operador123* | Operador |

Restricciones importantes que garantiza la base de datos:

- Un solo cobro por placa, sede y día operativo (RN-04).
- Un solo pago por cobro y referencia de pago única (idempotencia).
- Un vehículo no puede tener dos permanencias activas, y un espacio no puede estar ocupado por dos vehículos.

## Pruebas

```bash
cd backend
npm test                   # pruebas unitarias
npm run test:e2e           # pruebas de punta a punta
npm run test:integracion   # integración con PostgreSQL de pruebas (ver abajo)
npm run lint               # revisión de estilo
```

### Pruebas de integración

Usan una base de datos **separada** de la de desarrollo: un PostgreSQL desechable en el puerto 5433
(`docker-compose.test.yml`), con los datos en memoria. Las pruebas fuerzan esa base y se niegan a correr
contra cualquier otra.

```bash
docker compose -f docker-compose.test.yml up -d db-test   # encender la base de pruebas
cd backend
npm run test:integracion                                  # aplica las migraciones y corre las pruebas
docker compose -f docker-compose.test.yml down            # apagarla
```

Cubren los casos TC-11 a TC-14 del plan: ingreso bloqueado con el parqueadero lleno aunque el pase esté
pagado, reingreso sin cobro nuevo al liberarse un espacio, dos vehículos compitiendo por el último
espacio, y salida bloqueada que no libera el espacio.

## Variables de entorno

Copie `.env.example` como `.env` y complete los valores. **El archivo `.env` nunca se sube al repositorio.**

| Variable | Descripción |
|---|---|
| `PORT` | Puerto del backend (3000) |
| `TZ_SEDE` | Zona horaria de la sede (`America/Bogota`) |
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB` | Credenciales del contenedor de PostgreSQL |
| `DATABASE_URL` | Cadena de conexión que usa Prisma |
| `JWT_SECRET` | Clave para firmar los tokens de sesión |
| `JWT_EXPIRES_IN` | Duración de la sesión (por ejemplo `8h`) |

## Flujo de trabajo (Gitflow)

- `main`: solo versiones liberadas (tags `vX.Y.Z`).
- `develop`: integración. Es la rama por defecto.
- `feature/PARQ-XX-descripcion`: una rama por tarea de Jira; sale de `develop` y vuelve a `develop` por pull request.
- `release/x.y.z`: sale de `develop` y entra a `main` por pull request.
- `hotfix/x.y.z`: solo si aplica; sale de `main` y vuelve a `main` y a `develop`.

Reglas:

- No hay commits directos a `main` ni a `develop`: todo entra por pull request.
- Cada pull request necesita la aprobación de otro integrante.
- Los commits siguen [Conventional Commits](https://www.conventionalcommits.org/es/) e incluyen la clave de Jira.

| Tipo | Uso | Ejemplo |
|---|---|---|
| `feat` | Funcionalidad nueva | `feat(accesos): registra ingreso con anti-passback PARQ-17` |
| `fix` | Corrección | `fix(cobros): corrige franja a las 06:00 PARQ-24` |
| `test` | Pruebas | `test(cobros): escenario 7 del contexto PARQ-40` |
| `docs` | Documentación | `docs: agrega variables de entorno al README PARQ-5` |
| `chore` | Configuración | `chore: configura docker compose PARQ-8` |
| `refactor` | Reorganizar sin cambiar comportamiento | `refactor(tarifas): extrae cálculo de franja PARQ-22` |
